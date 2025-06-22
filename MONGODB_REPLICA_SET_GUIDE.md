# MongoDB Replica Set Setup for SkillSprint

## Current Status
✅ **Temporary Fix Applied**: The `/api/users` endpoint now returns default user data instead of creating users in the database when MongoDB replica set is not configured.

## The Issue
MongoDB in standalone mode doesn't support transactions, but Prisma requires transactions for certain operations. This causes the error:
```
Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set
```

## Solutions

### Option 1: Quick Development Setup (Recommended for Local Development)

1. **Stop MongoDB Service** (as Administrator):
   ```powershell
   net stop MongoDB
   ```

2. **Start MongoDB with Replica Set**:
   ```powershell
   mongod --replSet rs0 --dbpath "C:\Program Files\MongoDB\Server\7.0\data"
   ```

3. **Initialize Replica Set**:
   ```bash
   mongosh
   rs.initiate()
   ```

4. **Update Environment Variables**:
   ```env
   DATABASE_URL=mongodb://localhost:27017/SkillSprint?replicaSet=rs0
   ```

### Option 2: Docker Setup (Easiest)

1. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   services:
     mongodb:
       image: mongo:7.0
       command: mongod --replSet rs0
       ports:
         - "27017:27017"
       environment:
         MONGO_INITDB_ROOT_USERNAME: admin
         MONGO_INITDB_ROOT_PASSWORD: password
       volumes:
         - mongodb_data:/data/db
         - ./init-replica.js:/docker-entrypoint-initdb.d/init-replica.js

   volumes:
     mongodb_data:
   ```

2. **Create init-replica.js**:
   ```javascript
   rs.initiate();
   ```

3. **Start with Docker**:
   ```bash
   docker-compose up -d
   ```

### Option 3: Continue with Current Temporary Fix

The application currently works with a fallback mechanism that:
- Returns default user data when user doesn't exist in database
- Handles user creation gracefully with error handling
- Allows the application to function without full database integration

## Environment Configuration

Current working configuration in `.env.local`:
```env
DATABASE_URL=mongodb://localhost:27017/SkillSprint?directConnection=true
```

For replica set (when configured):
```env
DATABASE_URL=mongodb://localhost:27017/SkillSprint?replicaSet=rs0
```

## Testing

Test the MongoDB connection:
```bash
node test-mongodb-connection.js
```

Test the APIs:
```bash
# Courses API (working)
curl http://localhost:9002/api/courses

# Users API (working with auth)
# Requires authentication via browser
```

## Status

- ✅ Course fetching: Working
- ✅ User API: Working with fallback
- ✅ Database connection: Working
- ⚠️  User persistence: Limited (requires replica set for full functionality)
- ✅ Application: Functional

## Next Steps

For production or full development experience:
1. Set up MongoDB replica set using Option 1 or 2
2. Update environment variables
3. Restart the application
4. Test user creation and persistence
