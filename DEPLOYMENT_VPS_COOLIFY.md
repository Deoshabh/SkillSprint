# Deploying SkillSprint to a VPS with Coolify

This guide provides comprehensive steps for deploying the SkillSprint Next.js PWA application to a Virtual Private Server (VPS) using the Coolify self-hostable PaaS.

## 🚀 Quick Deploy

SkillSprint is now production-ready with:
- ✅ Mobile-optimized PWA
- ✅ Docker containerization
- ✅ Health checks and monitoring
- ✅ Optimized build configuration
- ✅ Security headers and CSP
- ✅ Performance optimizations

## 1. Introduction

Coolify is an open-source, self-hostable alternative to services like Heroku and Vercel. Deploying SkillSprint to a VPS via Coolify gives you complete control over your infrastructure and data.

**SkillSprint Features:**
- **Progressive Web App (PWA)** with offline support
- **Mobile-First Design** with touch-optimized UI
- **AI-Powered Course Import** with comprehensive link extraction
- **Next.js Server-Side Rendering** for optimal performance
- **Genkit AI Flows** for intelligent content processing
- **YouTube Integration** with ad-blocking service worker

## 2. Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04/22.04 LTS (recommended)
- **RAM**: Minimum 2GB (4GB+ recommended for production)
- **CPU**: 2+ cores recommended
- **Storage**: 20GB+ SSD
- **Network**: Stable internet connection

### Required Software
1. **Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

2. **Coolify Installation**
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

### Domain & DNS
- Domain name pointed to your VPS IP
- SSL certificate (Let's Encrypt via Coolify)

## 3. Environment Configuration

Create your environment variables in Coolify:

### Required Variables
```env
# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production

# Google Services (Required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# Security
NEXTAUTH_SECRET=your_32_character_secret_here
```

### Optional Variables
```env
# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
GOOGLE_SITE_VERIFICATION=your_verification_code

# Database (if using external DB)
DATABASE_URL=mongodb://username:password@host:port/database
MONGODB_URI=mongodb://connection_string

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Performance Monitoring
SENTRY_DSN=https://your_sentry_dsn
```

## 4. Deployment Steps

### Step 1: Prepare Your Repository
1. **Push your code** to a Git repository (GitHub, GitLab, etc.)
2. **Ensure all changes are committed** including:
   - Mobile-optimized components
   - PWA manifest and service worker
   - Production build configuration
   - Docker files

### Step 2: Create Application in Coolify
1. **Access Coolify Dashboard** at `http://your-vps-ip:8000`
2. **Create New Application**:
   - Choose "Git Repository"
   - Connect your repository
   - Select the main/production branch

### Step 3: Configure Build Settings
1. **Build Pack**: Automatic detection (should pick Node.js/Next.js)
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Port**: `3000`
5. **Health Check URL**: `/api/health`

### Step 4: Set Environment Variables
Add all required environment variables in Coolify's environment section.

### Step 5: Configure Domain & SSL
1. **Add your domain** in the domains section
2. **Enable SSL** (Let's Encrypt)
3. **Configure DNS** to point to your VPS IP

### Step 6: Deploy
1. **Click Deploy** in Coolify
2. **Monitor build logs** for any issues
3. **Verify health check** passes
4. **Test the application** in browser and mobile

## 5. Mobile PWA Features

Your deployed SkillSprint app includes:

### 📱 Mobile Optimizations
- **Touch-friendly interface** with 44px minimum touch targets
- **Responsive design** for all screen sizes
- **Bottom navigation** for mobile devices
- **Mobile-safe padding** for notched devices
- **Optimized input fields** (no zoom on iOS)

### 🔧 PWA Features
- **Offline support** via service worker
- **App-like experience** when installed
- **Push notifications** capability
- **Background sync** for data updates
- **Ad blocking** for YouTube content

### ⚡ Performance Features
- **Image optimization** with WebP/AVIF formats
- **Code splitting** for faster loading
- **Static asset caching** with long-term headers
- **Preloading** of critical resources

## 6. Production Optimizations

### Security
- **Security headers** implemented (CSP, HSTS, etc.)
- **HTTPS enforcement** via Coolify
- **Input validation** and sanitization
- **Rate limiting** for API endpoints

### Performance
- **Bundle optimization** with tree shaking
- **Image compression** and lazy loading
- **Font optimization** with preloading
- **Database connection pooling** (if using external DB)

### Monitoring
- **Health check endpoint** at `/api/health`
- **Error tracking** with Sentry (optional)
- **Performance monitoring** with Web Vitals
- **Uptime monitoring** via Coolify

## 7. Post-Deployment Checklist

### ✅ Functionality Tests
- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] Course import system functions
- [ ] AI features respond (with valid API keys)
- [ ] Mobile navigation works
- [ ] PWA installation works

### ✅ Performance Tests
- [ ] Page load times < 3 seconds
- [ ] Mobile lighthouse score > 90
- [ ] PWA audit passes
- [ ] Image optimization working
- [ ] Caching headers correct

### ✅ Security Tests
- [ ] HTTPS works properly
- [ ] Security headers present
- [ ] No sensitive data exposed
- [ ] API endpoints secured
- [ ] Input validation working

## 8. Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check node version compatibility
npm ls
npm audit fix

# Clear build cache
npm run clean
npm run build
```

**Environment Variables:**
- Ensure all required variables are set
- Check for typos in variable names
- Verify API keys are valid

**Mobile Issues:**
- Test on actual devices
- Check viewport meta tag
- Verify touch targets are 44px+
- Test PWA installation

**Performance Issues:**
- Enable compression in production
- Optimize images and fonts
- Check database query performance
- Monitor memory usage

### Logs and Debugging
```bash
# Check Coolify logs
docker logs coolify-container-name

# Monitor application health
curl https://your-domain.com/api/health

# Check PWA status
chrome://inspect/#service-workers
```

## 9. Scaling and Monitoring

### Horizontal Scaling
- Use Coolify's load balancer for multiple instances
- Configure session storage (Redis recommended)
- Implement database connection pooling

### Monitoring Setup
- **Uptime monitoring** via UptimeRobot or similar
- **Error tracking** with Sentry
- **Performance monitoring** with New Relic or DataDog
- **Log aggregation** with ELK stack

### Backup Strategy
- **Database backups** (if using external DB)
- **File system backups** for uploaded content
- **Environment variable backups**
- **Code repository backups**

## 10. Mobile App Distribution (Optional)

### PWA Store Distribution
- **Microsoft Store** (PWA support)
- **Google Play Store** (TWA - Trusted Web Activity)
- **Meta Quest Store** (PWA support)

### App Store Optimization
- Create app screenshots for mobile
- Write compelling app descriptions
- Add proper app categories and keywords
- Implement app store analytics

---

## 🎉 Congratulations!

Your SkillSprint PWA is now deployed and production-ready with:
- ✅ Mobile-first responsive design
- ✅ Progressive Web App features
- ✅ Production-grade security
- ✅ Performance optimizations
- ✅ Monitoring and health checks
- ✅ Scalable architecture

Your users can now access SkillSprint on any device with a native app-like experience!
