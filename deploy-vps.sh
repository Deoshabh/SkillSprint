#!/bin/bash

# SkillSprint VPS Deployment Script
# This script helps deploy SkillSprint to a VPS with MongoDB

set -e  # Exit on any error

echo "🚀 SkillSprint VPS Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the SkillSprint root directory."
    exit 1
fi

print_status "Starting SkillSprint deployment..."

# Step 1: Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_success "Node.js is already installed ($(node --version))"
fi

# Step 3: Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_success "PM2 is already installed"
fi

# Step 4: Install dependencies
print_status "Installing project dependencies..."
npm install

# Step 5: Check for environment file
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    print_warning "Please edit .env.local with your actual configuration:"
    print_warning "  - MongoDB connection string"
    print_warning "  - Clerk authentication keys"
    print_warning "  - Google AI API key"
    print_warning "  - Your domain URL"
    
    echo ""
    echo "Example MongoDB connection strings:"
    echo "  Local: mongodb://username:password@localhost:27017/skillsprint"
    echo "  Atlas: mongodb+srv://username:password@cluster.mongodb.net/skillsprint"
    echo ""
    
    read -p "Press Enter after you've updated .env.local..."
fi

# Step 6: Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Step 7: Test MongoDB connection
print_status "Testing MongoDB connection..."
if node test-mongodb-connection.js; then
    print_success "MongoDB connection test passed!"
else
    print_error "MongoDB connection test failed. Please check your configuration."
    exit 1
fi

# Step 8: Build the application
print_status "Building the application..."
npm run build

# Step 9: Setup PM2 ecosystem file
print_status "Creating PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
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
EOF

# Step 10: Setup nginx configuration (optional)
if command -v nginx &> /dev/null; then
    print_status "Setting up Nginx configuration..."
    
    read -p "Enter your domain name (e.g., skillsprint.yourdomain.com): " DOMAIN_NAME
    
    if [ ! -z "$DOMAIN_NAME" ]; then
        sudo tee /etc/nginx/sites-available/skillsprint << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

        sudo ln -sf /etc/nginx/sites-available/skillsprint /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        
        print_success "Nginx configuration created for $DOMAIN_NAME"
        print_status "You may want to setup SSL with certbot:"
        print_status "  sudo apt install certbot python3-certbot-nginx"
        print_status "  sudo certbot --nginx -d $DOMAIN_NAME"
    fi
fi

# Step 11: Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_success "Deployment completed successfully! 🎉"
echo ""
echo "📋 Next Steps:"
echo "  1. Your application is running on port 3000"
echo "  2. PM2 is managing the process"
echo "  3. Check application status: pm2 status"
echo "  4. View logs: pm2 logs skillsprint"
echo "  5. Restart app: pm2 restart skillsprint"
echo ""
echo "🔧 Useful Commands:"
echo "  pm2 status           - Check application status"
echo "  pm2 logs skillsprint - View application logs"
echo "  pm2 restart skillsprint - Restart the application"
echo "  pm2 stop skillsprint - Stop the application"
echo "  pm2 delete skillsprint - Remove from PM2"
echo ""
echo "🌐 Access your application:"
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "  https://$DOMAIN_NAME (after SSL setup)"
    echo "  http://$DOMAIN_NAME"
else
    echo "  http://your-server-ip:3000"
fi
echo ""
print_success "SkillSprint is now running on your VPS! 🚀"
