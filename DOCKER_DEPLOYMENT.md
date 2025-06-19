# Docker Deployment Guide

## Overview

This project has been successfully containerized with Docker and can be deployed using Docker Compose. The setup includes:

- **Next.js Application**: Containerized with multi-stage build for production
- **MongoDB Database**: Persistent data storage with authentication
- **Health Checks**: Automated monitoring of application health
- **Environment Configuration**: Secure environment variable management

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see `.env.example`)

### Deploy with Docker Compose

1. **Copy environment configuration:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update environment variables** in `.env.local`:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://admin:password@mongodb:27017/skillsprint?authSource=admin
   
   # Application Configuration
   NEXTAUTH_SECRET=your-secret-key-here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   
   # Add other environment variables as needed
   ```

3. **Start the services:**
   ```bash
   docker-compose up -d
   ```

4. **Verify deployment:**
   ```bash
   docker-compose ps
   ```

5. **Check application health:**
   ```bash
   curl http://localhost:3000/api/health
   ```

## Architecture

### Docker Images

- **Application**: Multi-stage build using Node.js 20 Alpine
  - Dependencies stage: Installs production dependencies
  - Builder stage: Builds the Next.js application
  - Runner stage: Production runtime with minimal footprint

- **Database**: MongoDB 6.0 with persistent volumes

### Services

#### SkillSprint Application
- **Port**: 3000
- **Health Check**: `/api/health` endpoint
- **Environment**: Production mode with runtime flag
- **User**: Non-root user (nextjs:nodejs)

#### MongoDB Database
- **Port**: 27017
- **Authentication**: admin/password (configurable)
- **Persistence**: Named volume `mongodb_data`
- **Database**: `skillsprint`
   ```
   
3. **Edit `.env.local` with your configuration values**

4. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

The application will be available at http://localhost:3000

## Environment Variables

### Required for Runtime
- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js session encryption
- `NEXTAUTH_URL` - Base URL of your application

### Optional
- `GOOGLE_CLIENT_ID` - For Google OAuth authentication
- `GOOGLE_CLIENT_SECRET` - For Google OAuth authentication
- `NEXT_PUBLIC_BASE_URL` - Public URL for the application

## Docker Configuration

The Docker setup includes:

### Multi-stage Build
- **deps**: Installs production dependencies
- **builder**: Builds the Next.js application
- **runner**: Runs the production application

### Key Features
- **Build-time safety**: MongoDB connection is not required during build
- **Runtime environment detection**: Uses `RUNTIME=true` environment variable
- **Optimized for production**: Uses Next.js standalone output
- **Security**: Runs as non-root user
- **Health checks**: Built-in health monitoring

## Database Setup

### Option 1: Use Docker Compose MongoDB (Recommended for Development)
Uncomment the MongoDB service in `docker-compose.yml`:

```yaml
mongodb:
  image: mongo:6.0
  container_name: skillsprint-mongo
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: password
  volumes:
    - mongodb_data:/data/db
  restart: unless-stopped
```

### Option 2: External MongoDB
Set `MONGODB_URI` to your external MongoDB connection string:
```
MONGODB_URI=mongodb://your-mongo-host:27017/skillsprint
```

## Build Process

The Docker build is designed to work without database connectivity:

1. **Build stage**: No MongoDB connection required
2. **Runtime stage**: MongoDB connection established when container starts

This ensures reliable builds in CI/CD environments where the database might not be available.

## Production Deployment

For production deployment:

1. **Use a managed MongoDB service** (Atlas, etc.)
2. **Set strong secrets** in environment variables
3. **Configure proper domain** in `NEXTAUTH_URL`
4. **Use HTTPS** in production
5. **Set up monitoring** and log aggregation
6. **Configure backup strategies** for your database

## Troubleshooting

### Build Issues
- Ensure Docker has sufficient memory (4GB+ recommended)
- Check that all required build dependencies are available
- Verify Node.js version compatibility

### Runtime Issues
- Verify `MONGODB_URI` is correctly set and accessible
- Check that all required environment variables are set
- Review container logs: `docker-compose logs skillsprint`

### Database Connection Issues
- Ensure MongoDB is running and accessible
- Verify connection string format
- Check network connectivity between containers

## Commands

```bash
# Build the image
docker build -t skillsprint .

# Run with Docker Compose
docker-compose up --build

# View logs
docker-compose logs -f skillsprint

# Stop services
docker-compose down

# Remove everything including volumes
docker-compose down -v
```
