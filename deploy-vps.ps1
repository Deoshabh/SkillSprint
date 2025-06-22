# SkillSprint VPS Deployment Script (PowerShell)
# This script helps deploy SkillSprint to a Windows VPS with MongoDB

param(
    [string]$DomainName = "",
    [switch]$SkipDependencies = $false
)

# Colors for output
$ErrorActionPreference = "Stop"

function Write-Status($Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success($Message) {
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning($Message) {
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error($Message) {
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "🚀 SkillSprint VPS Deployment Script (Windows)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the SkillSprint root directory."
    exit 1
}

Write-Status "Starting SkillSprint deployment..."

# Step 1: Check Node.js installation
Write-Status "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js is installed ($nodeVersion)"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
}

# Step 2: Check npm installation
Write-Status "Checking npm installation..."
try {
    $npmVersion = npm --version
    Write-Success "npm is available ($npmVersion)"
} catch {
    Write-Error "npm is not available. Please ensure npm is installed with Node.js."
    exit 1
}

# Step 3: Install dependencies
if (-not $SkipDependencies) {
    Write-Status "Installing project dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Step 4: Check for environment file
if (-not (Test-Path ".env.local")) {
    Write-Warning ".env.local not found. Creating from .env.example..."
    Copy-Item ".env.example" ".env.local"
    Write-Warning "Please edit .env.local with your actual configuration:"
    Write-Warning "  - MongoDB connection string"
    Write-Warning "  - Clerk authentication keys"
    Write-Warning "  - Google AI API key"
    Write-Warning "  - Your domain URL"
    
    Write-Host ""
    Write-Host "Example MongoDB connection strings:" -ForegroundColor Yellow
    Write-Host "  Local: mongodb://username:password@localhost:27017/skillsprint" -ForegroundColor Yellow
    Write-Host "  Atlas: mongodb+srv://username:password@cluster.mongodb.net/skillsprint" -ForegroundColor Yellow
    Write-Host ""
    
    Read-Host "Press Enter after you've updated .env.local"
}

# Step 5: Generate Prisma client
Write-Status "Generating Prisma client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate Prisma client"
    exit 1
}

# Step 6: Test MongoDB connection
Write-Status "Testing MongoDB connection..."
node test-mongodb-connection.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "MongoDB connection test failed. Please check your configuration."
    exit 1
}
Write-Success "MongoDB connection test passed!"

# Step 7: Build the application
Write-Status "Building the application..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}

# Step 8: Install PM2 globally if not present
Write-Status "Checking PM2 installation..."
try {
    pm2 --version | Out-Null
    Write-Success "PM2 is already installed"
} catch {
    Write-Status "Installing PM2 globally..."
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install PM2"
        exit 1
    }
}

# Step 9: Create PM2 ecosystem file
Write-Status "Creating PM2 ecosystem file..."
$ecosystemConfig = @"
module.exports = {
  apps: [{
    name: 'skillsprint',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
"@

$ecosystemConfig | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8

# Step 10: Create Windows service script (optional)
Write-Status "Creating Windows service management scripts..."

$startScript = @"
@echo off
echo Starting SkillSprint...
pm2 start ecosystem.config.js
pm2 save
echo SkillSprint started successfully!
pause
"@

$stopScript = @"
@echo off
echo Stopping SkillSprint...
pm2 stop skillsprint
echo SkillSprint stopped successfully!
pause
"@

$statusScript = @"
@echo off
echo SkillSprint Status:
pm2 status
echo.
echo Logs:
pm2 logs skillsprint --lines 20
pause
"@

$startScript | Out-File -FilePath "start-skillsprint.bat" -Encoding ASCII
$stopScript | Out-File -FilePath "stop-skillsprint.bat" -Encoding ASCII
$statusScript | Out-File -FilePath "status-skillsprint.bat" -Encoding ASCII

# Step 11: Start the application with PM2
Write-Status "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 to start on system boot
Write-Status "Setting up PM2 startup..."
pm2 startup windows

Write-Success "Deployment completed successfully! 🎉"
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Your application is running on port 3000"
Write-Host "  2. PM2 is managing the process"
Write-Host "  3. Use the created .bat files to manage the service"
Write-Host ""
Write-Host "🔧 Management Scripts:" -ForegroundColor Cyan
Write-Host "  start-skillsprint.bat  - Start the application"
Write-Host "  stop-skillsprint.bat   - Stop the application"
Write-Host "  status-skillsprint.bat - Check status and logs"
Write-Host ""
Write-Host "🔧 Manual PM2 Commands:" -ForegroundColor Cyan
Write-Host "  pm2 status             - Check application status"
Write-Host "  pm2 logs skillsprint   - View application logs"
Write-Host "  pm2 restart skillsprint - Restart the application"
Write-Host "  pm2 stop skillsprint   - Stop the application"
Write-Host "  pm2 delete skillsprint - Remove from PM2"
Write-Host ""
Write-Host "🌐 Access your application:" -ForegroundColor Cyan
if ($DomainName) {
    Write-Host "  http://$DomainName"
} else {
    Write-Host "  http://localhost:3000"
    Write-Host "  http://your-server-ip:3000"
}
Write-Host ""

# Show firewall reminder
Write-Warning "Don't forget to:"
Write-Warning "  1. Open port 3000 in Windows Firewall"
Write-Warning "  2. Configure your domain DNS if using a custom domain"
Write-Warning "  3. Consider setting up a reverse proxy (IIS, nginx for Windows)"

Write-Success "SkillSprint is now running on your Windows VPS! 🚀"
