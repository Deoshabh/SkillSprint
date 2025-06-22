# 🚀 SkillSprint VPS Deployment Checklist

## Pre-Deployment Setup

### 1. MongoDB Setup
- [ ] Install MongoDB on VPS or set up MongoDB Atlas
- [ ] Create database user and configure authentication
- [ ] Test MongoDB connection from your local machine
- [ ] Note down connection string

### 2. Environment Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Update `DATABASE_URL` with your MongoDB connection string
- [ ] Set all required API keys (Clerk, Gemini, YouTube, etc.)
- [ ] Test environment variables: `node env-test.js`

### 3. Database Verification
- [ ] Test MongoDB connection: `node test-mongodb-connection.js`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Push database schema: `npx prisma db push`

## Deployment Steps

### Option A: Using Deployment Script (Recommended)

#### Linux/Mac:
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

#### Windows:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\deploy-vps.ps1
```

### Option B: Manual Deployment

#### 1. Server Preparation
- [ ] Install Node.js (v20+)
- [ ] Install PM2: `npm install -g pm2`
- [ ] Install Git
- [ ] Clone repository to VPS

#### 2. Application Setup
- [ ] Install dependencies: `npm install`
- [ ] Create production environment file
- [ ] Build application: `npm run build`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Push database schema: `npx prisma db push`

#### 3. Process Management
- [ ] Start with PM2: `pm2 start npm --name "skillsprint" -- start`
- [ ] Save PM2 configuration: `pm2 save`
- [ ] Setup PM2 startup: `pm2 startup`

#### 4. Web Server Configuration
- [ ] Install Nginx (recommended)
- [ ] Configure reverse proxy
- [ ] Set up SSL certificate
- [ ] Configure firewall

## Post-Deployment Verification

### 1. Application Health
- [ ] Check application status: `pm2 status`
- [ ] View application logs: `pm2 logs skillsprint`
- [ ] Test website accessibility
- [ ] Verify all pages load correctly

### 2. Database Connectivity
- [ ] Run connection test on server: `node test-mongodb-connection.js`
- [ ] Test user registration/login
- [ ] Verify course creation functionality
- [ ] Check data persistence

### 3. Features Testing
- [ ] User authentication (Clerk)
- [ ] Course enrollment
- [ ] Progress tracking
- [ ] AI features (quiz generation, course creation)
- [ ] Note-taking and sketching
- [ ] Daily planning

## Monitoring & Maintenance

### Essential Commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs skillsprint

# Restart application
pm2 restart skillsprint

# Monitor resources
pm2 monit

# Update application
git pull
npm install
npm run build
pm2 restart skillsprint
```

### Backup Strategy
- [ ] Set up automated MongoDB backups
- [ ] Create backup restoration procedure
- [ ] Test backup/restore process

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version (requires v20+)
2. **Database Connection**: Verify MongoDB service and connection string
3. **Environment Variables**: Ensure all required variables are set
4. **Port Conflicts**: Default port is 3000, ensure it's available
5. **Permissions**: Check file/directory permissions

### Support Resources
- `MONGODB_MIGRATION_GUIDE.md` - Detailed setup instructions
- `MIGRATION_COMPLETION_SUMMARY.md` - Migration overview
- Application logs: `pm2 logs skillsprint`
- MongoDB logs: Check MongoDB service logs

---

**🎯 Deployment Goal**: SkillSprint running on VPS with MongoDB  
**📚 Additional Help**: See `MONGODB_MIGRATION_GUIDE.md` for detailed instructions
