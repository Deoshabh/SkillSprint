# SkillSprint Docker Deployment Guide

This guide explains how to deploy SkillSprint using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- A MongoDB database (can be local, Atlas, or Docker container)
- Required environment variables configured

## Environment Variables

Create a `.env.local` file (for local development) or `.env.production` file (for production) with the following variables:

```bash
# Database
DATABASE_URL="mongodb://username:password@localhost:27017/skillsprint"

# Authentication (NextAuth)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Clerk Authentication
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"
```

## Local Development with Docker

1. **Build and run with local MongoDB:**
   ```bash
   docker-compose up --build
   ```

2. **Run only the app (with external MongoDB):**
   ```bash
   docker-compose up --build skillsprint
   ```

3. **Access the application:**
   - Application: http://localhost:3000
   - MongoDB: mongodb://localhost:27017

## Production Deployment

### Option 1: Using Docker Compose (Recommended)

1. **Set up environment variables:**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production values
   ```

2. **Deploy with production compose file:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### Option 2: Using Dockerfile directly

1. **Build the image:**
   ```bash
   docker build -t skillsprint .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name skillsprint \
     -p 3000:3000 \
     --env-file .env.production \
     skillsprint
   ```

### Option 3: Using a Platform (Coolify, Railway, etc.)

1. **Ensure your repository has:**
   - `Dockerfile` (✅ included)
   - Environment variables configured in the platform

2. **Connect your GitHub repository to the platform**

3. **The platform will automatically build and deploy using the Dockerfile**

## Database Setup

### Using MongoDB Atlas (Recommended for Production)

1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Update `DATABASE_URL` in your environment variables

### Using Local MongoDB

1. **With Docker Compose:**
   ```bash
   docker-compose up mongodb
   ```

2. **Or install MongoDB locally and run:**
   ```bash
   mongod --dbpath /path/to/your/db
   ```

## Health Check

The application includes a health check endpoint at `/api/health` that returns:
- Application status
- Uptime
- Timestamp
- Version

## Troubleshooting

### Build Issues

1. **Node modules not found:**
   ```bash
   docker-compose down --volumes
   docker-compose up --build
   ```

2. **Prisma client issues:**
   ```bash
   docker exec -it skillsprint npx prisma generate
   ```

### Runtime Issues

1. **Check logs:**
   ```bash
   docker-compose logs skillsprint
   ```

2. **Access container shell:**
   ```bash
   docker exec -it skillsprint sh
   ```

3. **Database connection issues:**
   - Verify `DATABASE_URL` is correct
   - Ensure MongoDB is accessible
   - Check network connectivity

### Environment Variables

1. **Missing variables:**
   - Check `.env.local` or `.env.production` file
   - Verify all required variables are set
   - Restart containers after changing environment

## Scaling

For production scaling, you can:

1. **Horizontal scaling:**
   ```bash
   docker-compose up --scale skillsprint=3
   ```

2. **Use a load balancer (nginx, traefik, etc.)**

3. **Deploy to Kubernetes or Docker Swarm**

## Security

1. **Use secrets management** for sensitive environment variables
2. **Enable HTTPS** with a reverse proxy
3. **Regularly update** base images and dependencies
4. **Monitor** application logs and metrics

## Backup

1. **Database backup:**
   ```bash
   docker exec mongodb mongodump --out /backup
   ```

2. **File uploads backup** (if any persistent volumes)

For more information, see the main README.md file.
