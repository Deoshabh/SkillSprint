# MongoDB Migration Guide for SkillSprint

## ✅ Migration Complete

This project has been successfully migrated from PostgreSQL to MongoDB. All Firebase/Firestore dependencies have been removed.

## 🔄 Changes Made

### 1. Prisma Schema Updates
- **Database Provider**: Changed from `postgresql` to `mongodb`
- **ID Fields**: Updated all `@id @default(cuid())` to `@id @default(auto()) @map("_id") @db.ObjectId`
- **Foreign Keys**: Updated all foreign key references to use `@db.ObjectId`
- **Table Mapping**: Removed `@@map` directives (MongoDB uses collection names automatically)
- **Unique Constraints**: Maintained all `@@unique` constraints for MongoDB

### 2. Removed Dependencies
- **Firebase**: Removed `firebase: "^11.9.1"` from package.json
- **No Firestore Code**: Confirmed no Firebase/Firestore imports exist in the codebase

### 3. Environment Configuration
- **Updated .env.example**: Added MongoDB connection string examples
- **Connection Format**: Supports both standard MongoDB and MongoDB Atlas formats

## 🚀 Deployment Setup

### 1. MongoDB Setup on VPS

#### Option A: Install MongoDB on your VPS
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
use skillsprint
db.createUser({
  user: "skillsprint_user",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "skillsprint" }]
})
```

#### Option B: Use MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your VPS IP address
5. Get the connection string

### 2. Environment Variables

Create `.env.local` file:
```bash
# For VPS MongoDB
DATABASE_URL="mongodb://skillsprint_user:your_secure_password@your-vps-ip:27017/skillsprint"

# For MongoDB Atlas
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/skillsprint"

# Other required variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_key"
CLERK_SECRET_KEY="your_clerk_secret"
GOOGLE_GENAI_API_KEY="your_google_ai_key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 3. Deploy to VPS

#### Using Coolify (Recommended)
1. **Push to Git**: Commit all changes to your repository
2. **Coolify Setup**: 
   - Connect your repository to Coolify
   - Set environment variables in Coolify dashboard
   - Deploy the application

#### Manual Deployment
```bash
# Clone repository on VPS
git clone https://github.com/your-username/SkillSprint.git
cd SkillSprint

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Start the application
npm start
```

## 🔧 Development Setup

### Local Development with MongoDB

1. **Install MongoDB locally** or use MongoDB Atlas
2. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/SkillSprint.git
   cd SkillSprint
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Setup environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB connection details
   ```

5. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

## 📊 Database Schema

### MongoDB Collections

The following collections will be created automatically:

- `User` - User accounts and profiles
- `Course` - Course information and metadata
- `Module` - Course modules and content
- `VideoLink` - Video content links
- `Enrollment` - User course enrollments
- `UserProgress` - Learning progress tracking
- `ModuleProgress` - Module-specific progress
- `Quiz` - Quiz data and questions
- `Badge` - Achievement badges
- `UserBadge` - User earned badges
- `TextNote` - User notes
- `Sketch` - User sketches and drawings
- `DailyPlan` - Daily learning plans
- `Feedback` - User feedback
- `XAPIStatement` - xAPI analytics data

### Key Changes for MongoDB

1. **ObjectId Fields**: All ID fields now use MongoDB ObjectId format
2. **No Table Names**: MongoDB uses collection names automatically
3. **JSON Support**: Full JSON support for flexible data structures
4. **Array Support**: Native array support for fields like `subtopics`, `learningTracks`

## ⚠️ Important Notes

### Migration Considerations

1. **Data Migration**: If you have existing PostgreSQL data, you'll need to:
   - Export data from PostgreSQL
   - Transform ID fields to ObjectId format
   - Import into MongoDB

2. **Connection Pooling**: MongoDB handles connection pooling differently:
   - Default max pool size: 100
   - Configurable via connection string parameters

3. **Transactions**: MongoDB supports transactions for replica sets and sharded clusters

### Security Best Practices

1. **Authentication**: Always use authenticated MongoDB connections
2. **Network Security**: Restrict MongoDB access to your application servers
3. **Encryption**: Use TLS/SSL for MongoDB connections in production
4. **User Permissions**: Create database users with minimal required permissions

## 🧪 Testing

### Verify MongoDB Connection

Create a test script to verify the connection:

```javascript
// test-db.js
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ MongoDB connection successful');
    
    // Test basic operation
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run the test:
```bash
node test-db.js
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Prisma MongoDB Guide](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Coolify Deployment Guide](https://coolify.io/docs)

## 🚀 Benefits of MongoDB Migration

1. **Scalability**: Better horizontal scaling capabilities
2. **Flexibility**: Schema-less design for evolving data structures
3. **Performance**: Optimized for read-heavy workloads
4. **JSON Support**: Native JSON document storage
5. **Cloud Ready**: Easy integration with cloud services
6. **Cost Effective**: Generally more cost-effective for VPS deployments

## ✅ Migration Checklist

- [x] Update Prisma schema for MongoDB
- [x] Remove Firebase dependencies
- [x] Update environment configuration
- [x] Generate Prisma client
- [x] Test compilation
- [ ] Setup MongoDB on VPS
- [ ] Configure environment variables
- [ ] Deploy to production
- [ ] Test all functionality
- [ ] Migrate existing data (if any)

Your SkillSprint application is now ready for MongoDB deployment on your VPS! 🎉
