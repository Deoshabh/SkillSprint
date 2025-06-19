# 📋 SkillSprint Deployment Checklist

Use this checklist to ensure a successful deployment of SkillSprint.

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Node.js 18+ installed
- [ ] npm/yarn package manager installed
- [ ] Git repository cloned
- [ ] Environment variables configured (.env.production)
- [ ] Database (MongoDB) accessible
- [ ] Domain name configured (if applicable)

### ✅ External Services
- [ ] MongoDB Atlas cluster created (or local MongoDB setup)
- [ ] Google Cloud Console project created
- [ ] Google OAuth 2.0 credentials configured
- [ ] Google AI API key obtained
- [ ] YouTube Data API key obtained (optional)
- [ ] OAuth redirect URIs added to Google Console

### ✅ Database Configuration
- [ ] MongoDB connection string tested
- [ ] Database user created with appropriate permissions
- [ ] Network access configured (MongoDB Atlas)
- [ ] Database initialization completed

### ✅ Application Configuration
- [ ] All environment variables set
- [ ] NEXTAUTH_SECRET generated (32+ characters)
- [ ] NEXTAUTH_URL configured with correct domain
- [ ] Build process tested locally
- [ ] Health check endpoint accessible

## Deployment Options

Choose your deployment method:

### 🐳 Docker Deployment
- [ ] Docker installed on target system
- [ ] Docker Compose file configured
- [ ] Environment variables in .env.production
- [ ] docker-compose.yml updated with your values
- [ ] Build and test Docker image locally

### ▲ Vercel Deployment
- [ ] Vercel account created
- [ ] Vercel CLI installed
- [ ] vercel.json configured
- [ ] Environment variables set in Vercel dashboard
- [ ] Domain connected (if custom domain)

### 🔥 Firebase App Hosting
- [ ] Firebase project created
- [ ] Firebase CLI installed and authenticated
- [ ] apphosting.yaml configured
- [ ] Environment secrets configured
- [ ] Firebase billing enabled (if required)

### 🖥️ VPS Deployment
- [ ] VPS with Ubuntu 20.04/22.04 LTS
- [ ] SSH access configured
- [ ] Node.js 18+ installed on VPS
- [ ] PM2 process manager installed
- [ ] Nginx installed (optional)
- [ ] SSL certificate ready (Let's Encrypt recommended)

### 🚀 Coolify Deployment
- [ ] Coolify installed on VPS
- [ ] Git repository connected
- [ ] Build configuration set
- [ ] Environment variables configured
- [ ] Domain and SSL configured

## Post-Deployment Checklist

### ✅ Application Verification
- [ ] Application accessible via URL
- [ ] Health check endpoint responding (/api/health)
- [ ] User registration working
- [ ] User login working (both email and Google OAuth)
- [ ] Database connections established
- [ ] AI features functioning
- [ ] File uploads working (if applicable)

### ✅ PWA Features
- [ ] Service worker registered
- [ ] Manifest.json accessible
- [ ] App installable on mobile devices
- [ ] Offline functionality working
- [ ] Push notifications configured (if implemented)

### ✅ Performance & SEO
- [ ] Page load times acceptable (<3 seconds)
- [ ] Lighthouse score >90 for Performance
- [ ] Core Web Vitals optimized
- [ ] Sitemap.xml generated and accessible
- [ ] robots.txt configured
- [ ] Meta tags and OpenGraph configured

### ✅ Security
- [ ] HTTPS enabled and working
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting configured
- [ ] CORS policies configured

### ✅ Monitoring & Backup
- [ ] Application monitoring setup
- [ ] Error logging configured
- [ ] Database backup strategy implemented
- [ ] Uptime monitoring configured
- [ ] Alert notifications setup

## Environment Variables Reference

### Required Variables
```bash
MONGODB_URI=                    # Database connection string
NEXTAUTH_URL=                   # Your domain URL
NEXTAUTH_SECRET=                # 32+ character secret key
GOOGLE_CLIENT_ID=               # Google OAuth client ID
GOOGLE_CLIENT_SECRET=           # Google OAuth client secret
GOOGLE_AI_API_KEY=              # Google AI API key
NEXT_PUBLIC_BASE_URL=           # Public base URL
```

### Optional Variables
```bash
YOUTUBE_API_KEY=                # YouTube Data API key
EMAIL_SERVER_HOST=              # SMTP host
EMAIL_SERVER_USER=              # SMTP username
EMAIL_SERVER_PASSWORD=          # SMTP password
EMAIL_FROM=                     # From email address
REDIS_URL=                      # Redis connection string
GOOGLE_ANALYTICS_ID=            # GA4 measurement ID
```

## Quick Commands

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Commands
```bash
docker build -t skillsprint .
docker run -p 3000:3000 --env-file .env.production skillsprint
```

### PM2 Commands
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Troubleshooting Common Issues

### Build Failures
- [ ] Check Node.js version (18+)
- [ ] Clear cache: `npm run clean && npm install`
- [ ] Verify all dependencies installed
- [ ] Check for TypeScript errors: `npm run typecheck`

### Database Connection Issues
- [ ] Verify MongoDB URI format
- [ ] Check network connectivity
- [ ] Confirm database user permissions
- [ ] Test connection with MongoDB Compass

### OAuth Issues
- [ ] Verify Google Console configuration
- [ ] Check redirect URIs match exactly
- [ ] Confirm OAuth consent screen setup
- [ ] Verify client ID and secret

### Performance Issues
- [ ] Check server resources (CPU, RAM, disk)
- [ ] Monitor database performance
- [ ] Review application logs
- [ ] Optimize images and assets

## Support Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google Cloud Console](https://console.cloud.google.com)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Docker Documentation](https://docs.docker.com/)

## Final Verification

After completing deployment:

1. ✅ Application loads successfully
2. ✅ User can register and login
3. ✅ All features work as expected
4. ✅ Mobile experience is optimal
5. ✅ Performance meets expectations
6. ✅ Security measures are in place
7. ✅ Monitoring and backup are configured

**Deployment Status**: ⏳ In Progress / ✅ Complete

**Notes**:
_Add any deployment-specific notes here_

---

*This checklist ensures a comprehensive and successful deployment of SkillSprint.*
