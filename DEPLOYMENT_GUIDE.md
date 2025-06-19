# 🚀 SkillSprint Deployment Guide

This comprehensive guide covers multiple deployment options for the SkillSprint Next.js PWA application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment Options](#production-deployment-options)
   - [Docker Deployment](#docker-deployment)
   - [Vercel Deployment](#vercel-deployment)
   - [Firebase App Hosting](#firebase-app-hosting)
   - [VPS with Coolify](#vps-with-coolify)
   - [Manual VPS Deployment](#manual-vps-deployment)
5. [Database Setup](#database-setup)
6. [Domain & SSL Configuration](#domain--ssl-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🛠 Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher (or yarn/pnpm)
- **MongoDB**: 5.x or higher
- **Docker**: For containerized deployments
- **Domain Name**: For production deployment

### Required Accounts & Services
- **MongoDB Atlas** (recommended) or self-hosted MongoDB
- **Google Cloud Console** (for OAuth and AI services)
- **Firebase Project** (for App Hosting option)
- **Vercel Account** (for Vercel deployment)

---

## 🔧 Environment Configuration

### 1. Create Environment Files

Create the following environment files in your project root:

#### `.env.local` (for local development)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/skillsprint
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillsprint

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# Google OAuth (Create at https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services (Google AI/Gemini)
GOOGLE_AI_API_KEY=your-google-ai-api-key

# YouTube API (for playlist features)
YOUTUBE_API_KEY=your-youtube-api-key

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:9002

# Optional: Email configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

#### `.env.production` (for production)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillsprint

# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services
GOOGLE_AI_API_KEY=your-google-ai-api-key

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key

# Application URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Email configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### 2. Google Cloud Console Setup

1. **Create a Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing

2. **Enable APIs**:
   ```bash
   # Enable required APIs
   - Google AI/Gemini API
   - YouTube Data API v3
   - OAuth 2.0
   ```

3. **Create OAuth 2.0 Credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Add authorized origins:
     - `http://localhost:9002` (development)
     - `https://yourdomain.com` (production)
   - Add authorized redirect URIs:
     - `http://localhost:9002/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`

4. **Get API Keys**:
   - Create API keys for Google AI and YouTube Data API

---

## 💻 Local Development Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd SkillSprint-main

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
# Edit .env.local with your values
```

### 2. Database Setup
```bash
# Option 1: Local MongoDB
# Install MongoDB locally and start service

# Option 2: MongoDB Atlas
# Create cluster at https://cloud.mongodb.com
# Get connection string and add to .env.local
```

### 3. Initialize Database
```bash
# Seed admin user and sample data
npm run seed:admin
```

### 4. Start Development Server
```bash
# Start development server
npm run dev

# Server will be available at http://localhost:9002
```

---

## 🚀 Production Deployment Options

## 🐳 Docker Deployment

### 1. Build Docker Image
```bash
# Build the Docker image
docker build -t skillsprint:latest .

# Or with custom tag
docker build -t skillsprint:v1.0.0 .
```

### 2. Run with Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  skillsprint:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - mongodb

  mongodb:
    image: mongo:5
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password123
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - skillsprint
    restart: unless-stopped

volumes:
  mongodb_data:
```

### 3. Deploy
```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f skillsprint

# Stop the application
docker-compose down
```

---

## ▲ Vercel Deployment

### 1. Prepare for Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### 2. Configure Project
Create `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "GOOGLE_CLIENT_ID": "@google-client-id",
    "GOOGLE_CLIENT_SECRET": "@google-client-secret",
    "GOOGLE_AI_API_KEY": "@google-ai-api-key",
    "YOUTUBE_API_KEY": "@youtube-api-key"
  }
}
```

### 3. Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
# ... add all required environment variables
```

---

## 🔥 Firebase App Hosting

### 1. Setup Firebase
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init apphosting
```

### 2. Configure Firebase
The project already includes `apphosting.yaml`:
```yaml
runConfig:
  maxInstances: 1
```

### 3. Deploy
```bash
# Deploy to Firebase
firebase deploy --only apphosting

# Set environment variables
firebase apphosting:secrets:set MONGODB_URI
firebase apphosting:secrets:set NEXTAUTH_SECRET
# ... set all required secrets
```

---

## 🖥 VPS with Coolify

### 1. Install Coolify
```bash
# On your VPS (Ubuntu 20.04/22.04)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 2. Access Coolify
- Navigate to `http://your-vps-ip:8000`
- Complete initial setup

### 3. Deploy SkillSprint
1. **Create New Application**
2. **Connect Git Repository**
3. **Configure Environment Variables**
4. **Set Build Configuration**:
   ```bash
   Build Command: npm run build
   Start Command: npm start
   Port: 3000
   ```
5. **Deploy**

---

## 🔧 Manual VPS Deployment

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install MongoDB (optional, if not using Atlas)
sudo apt install mongodb -y
```

### 2. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd SkillSprint-main

# Install dependencies
npm install

# Build application
npm run build

# Create PM2 ecosystem file
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'skillsprint',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/SkillSprint-main',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production'
  }]
}
```

### 3. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 4. Configure Nginx
Create `/etc/nginx/sites-available/skillsprint`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/skillsprint /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🗄 Database Setup

### MongoDB Atlas (Recommended)
1. **Create Account**: [MongoDB Atlas](https://cloud.mongodb.com)
2. **Create Cluster**: Choose free tier for development
3. **Create Database User**: With read/write permissions
4. **Configure Network Access**: Add your server IPs
5. **Get Connection String**: Add to environment variables

### Self-Hosted MongoDB
```bash
# Install MongoDB
sudo apt install mongodb -y

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use skillsprint
> db.createUser({
    user: "skillsprint",
    pwd: "password123",
    roles: ["readWrite"]
  })
```

---

## 🌐 Domain & SSL Configuration

### 1. Domain Setup
- Point your domain's A record to your server's IP
- Add CNAME for www subdomain

### 2. SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Monitoring & Maintenance

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Check logs
pm2 logs skillsprint

# Restart application
pm2 restart skillsprint
```

### 2. Database Monitoring
```bash
# MongoDB status
sudo systemctl status mongodb

# Check database size
mongo --eval "db.stats()"
```

### 3. Server Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### 4. Backup Strategy
```bash
# Database backup script
#!/bin/bash
mongodump --uri="$MONGODB_URI" --out="/backups/$(date +%Y%m%d_%H%M%S)"

# Setup daily backups
sudo crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

---

## 🛠 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### 2. Environment Variable Issues
```bash
# Verify environment variables are loaded
console.log(process.env.MONGODB_URI)

# Check file permissions
ls -la .env*
```

#### 3. Database Connection Issues
```bash
# Test MongoDB connection
mongo "$MONGODB_URI"

# Check network connectivity
telnet cluster.mongodb.net 27017
```

#### 4. OAuth Issues
- Verify redirect URIs in Google Console
- Check that domain matches NEXTAUTH_URL
- Ensure OAuth consent screen is configured

#### 5. Performance Issues
```bash
# Monitor application
pm2 monit

# Check disk space
df -h

# Optimize images and assets
npm run build  # Already includes optimizations
```

### Health Checks

The application includes built-in health checks:
- **API Health**: `GET /api/health`
- **Database Health**: Included in health endpoint
- **Service Status**: Monitor via PM2 or Docker

### Logs Location
- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **MongoDB Logs**: `/var/log/mongodb/`

---

## 🎉 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database setup and accessible
- [ ] Google OAuth credentials configured
- [ ] Domain DNS configured
- [ ] SSL certificate ready

### Post-Deployment
- [ ] Application accessible via domain
- [ ] User registration/login working
- [ ] Database connections working
- [ ] AI features functioning
- [ ] Mobile PWA features working
- [ ] SSL certificate valid
- [ ] Performance monitoring setup
- [ ] Backup strategy implemented

### Security Checklist
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] SSL/TLS enabled
- [ ] Security headers configured
- [ ] Regular updates scheduled
- [ ] Monitoring and alerting setup

---

## 📞 Support

For deployment issues or questions:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment configuration
4. Check external service status (MongoDB Atlas, Google APIs)

---

## 🔄 Updates and Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Rebuild application
npm run build

# Restart services
pm2 restart skillsprint
```

### Security Updates
- Keep Node.js updated
- Update npm packages regularly
- Monitor for security advisories
- Update SSL certificates before expiry

This deployment guide covers all major deployment scenarios for SkillSprint. Choose the option that best fits your infrastructure needs and technical requirements.
