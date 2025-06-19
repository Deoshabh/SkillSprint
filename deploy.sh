#!/bin/bash

# SkillSprint Deployment Script
# This script automates the deployment process for SkillSprint

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="skillsprint"
APP_DIR="/var/www/skillsprint"
SERVICE_USER="www-data"
BACKUP_DIR="/var/backups/skillsprint"

# Functions
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

check_requirements() {
    print_status "Checking system requirements..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons"
        exit 1
    fi

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi

    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 is not installed. Installing..."
        sudo npm install -g pm2
    fi

    print_success "System requirements check passed"
}

backup_current_deployment() {
    if [ -d "$APP_DIR" ]; then
        print_status "Creating backup of current deployment..."
        
        # Create backup directory
        sudo mkdir -p "$BACKUP_DIR"
        
        # Create timestamped backup
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
        
        sudo cp -r "$APP_DIR" "$BACKUP_PATH"
        print_success "Backup created at $BACKUP_PATH"
    fi
}

deploy_application() {
    print_status "Deploying SkillSprint application..."
    
    # Create application directory
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    
    # Copy application files
    print_status "Copying application files..."
    cp -r ./* "$APP_DIR/"
    
    # Install dependencies
    print_status "Installing dependencies..."
    cd "$APP_DIR"
    npm ci --only=production
    
    # Build application
    print_status "Building application..."
    npm run build
    
    # Set permissions
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$APP_DIR"
    sudo chmod -R 755 "$APP_DIR"
    
    print_success "Application deployed successfully"
}

configure_pm2() {
    print_status "Configuring PM2..."
    
    cd "$APP_DIR"
    
    # Stop existing PM2 processes
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start application with PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    print_success "PM2 configured successfully"
}

configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Check if Nginx is installed
    if ! command -v nginx &> /dev/null; then
        print_error "Nginx is not installed. Please install Nginx first."
        return 1
    fi
    
    # Copy Nginx configuration
    sudo cp nginx.conf /etc/nginx/sites-available/$APP_NAME
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    print_success "Nginx configured successfully"
}

setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Check if Certbot is installed
    if ! command -v certbot &> /dev/null; then
        print_warning "Certbot is not installed. Installing..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Prompt for domain
    read -p "Enter your domain name: " DOMAIN
    
    # Generate SSL certificate
    sudo certbot --nginx -d $DOMAIN
    
    print_success "SSL certificate configured"
}

run_health_check() {
    print_status "Running health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Application is healthy"
    else
        print_error "Application health check failed"
        return 1
    fi
}

display_status() {
    print_status "Deployment Status:"
    echo "===================="
    
    # PM2 status
    echo "PM2 Processes:"
    pm2 status
    
    echo ""
    
    # Nginx status
    echo "Nginx Status:"
    sudo systemctl status nginx --no-pager -l
    
    echo ""
    
    # Application logs
    echo "Recent Application Logs:"
    pm2 logs $APP_NAME --lines 10
}

# Main deployment process
main() {
    print_status "Starting SkillSprint deployment..."
    echo "====================================="
    
    # Check requirements
    check_requirements
    
    # Create backup
    backup_current_deployment
    
    # Deploy application
    deploy_application
    
    # Configure PM2
    configure_pm2
    
    # Configure Nginx (optional)
    read -p "Configure Nginx? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        configure_nginx
    fi
    
    # Setup SSL (optional)
    read -p "Setup SSL certificate? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    fi
    
    # Run health check
    run_health_check
    
    # Display status
    display_status
    
    print_success "SkillSprint deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your environment variables in $APP_DIR/.env.production"
    echo "2. Restart the application: pm2 restart $APP_NAME"
    echo "3. Monitor logs: pm2 logs $APP_NAME"
    echo "4. Access your application at: http://your-domain.com"
}

# Script options
case "${1:-}" in
    --help|-h)
        echo "SkillSprint Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --status       Show current deployment status"
        echo "  --backup       Create backup only"
        echo "  --deploy       Deploy application only"
        echo ""
        exit 0
        ;;
    --status)
        display_status
        exit 0
        ;;
    --backup)
        backup_current_deployment
        exit 0
        ;;
    --deploy)
        deploy_application
        configure_pm2
        run_health_check
        exit 0
        ;;
    *)
        main
        ;;
esac
