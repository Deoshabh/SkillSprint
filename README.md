# SkillSprint - Learning Management Platform

SkillSprint is a modern, full-featured learning management system built with Next.js, featuring AI-powered course generation, progress tracking, and comprehensive user management.

## 🚀 Features

### Core Learning Features
- **Course Catalog**: Browse and enroll in courses across multiple categories
- **Progress Tracking**: Track learning progress with detailed analytics
- **Interactive Content**: Video lessons, quizzes, and hands-on practice tasks
- **Notes & Sketches**: Take notes and create drawings while learning
- **Daily Planning**: Organize learning schedule with built-in planner
- **Gamification**: Earn points and badges for achievements

### AI-Powered Tools
- **Course Generation**: AI-assisted course creation and syllabus generation
- **Content Discovery**: Intelligent video content suggestions
- **Quiz Generation**: Automated quiz and mock test creation
- **Doubt Solving**: AI-powered assistance for learning queries

### User Management
- **Authentication**: Secure user authentication with Clerk
- **Profile Management**: Customizable user profiles and preferences
- **Multi-Role Support**: Learner, Educator, and Admin roles
- **Progress Analytics**: Detailed learning analytics and insights

### Admin Features
- **Course Moderation**: Review and approve user-submitted courses
- **User Management**: Manage user roles and permissions
- **Analytics Dashboard**: Platform-wide usage and performance metrics
- **Feedback Management**: Handle user feedback and support requests

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: ShadCN UI, Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **AI Integration**: Google Genkit with Gemini
- **Deployment**: Firebase App Hosting / Vercel

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following key entities:
- Users (profiles, preferences, authentication)
- Courses (content, metadata, modules)
- Progress (tracking, achievements, enrollments)
- Content (videos, notes, sketches, daily plans)
- Feedback (user submissions, admin responses)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or cloud)
- Clerk account for authentication
- Google AI API key (for AI features)

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SkillSprint
   ```

2. **Automated Setup** (Recommended)
   ```bash
   # Windows
   setup-db.bat
   
   # macOS/Linux
   chmod +x setup-db.sh
   ./setup-db.sh
   ```

3. **Manual Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Copy environment template
   cp .env.example .env
   
   # Generate Prisma client
   npm run db:generate
   
   # Apply database schema
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

4. **Configure Environment**
   Update `.env` with your credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/skillsprint"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
   CLERK_SECRET_KEY="your_clerk_secret_key"
   GEMINI_API_KEY="your_gemini_api_key"
   YOUTUBE_API_KEY="your_youtube_api_key"
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:9002](http://localhost:9002) to access the application.

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks

# Database commands
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
npm run db:seed      # Seed database with sample data

# AI Development
npm run genkit:dev   # Start Genkit development UI
npm run genkit:watch # Start Genkit in watch mode
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Protected app routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # ShadCN UI components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── data-service.ts   # Database operations
│   ├── db.ts            # Prisma client
│   └── types.ts         # TypeScript types
├── context/              # React contexts
├── hooks/               # Custom React hooks
└── ai/                  # AI flows and configurations
    ├── flows/           # Genkit AI flows
    └── genkit.ts        # AI configuration

prisma/
├── schema.prisma        # Database schema
└── seed.ts             # Database seeding script
```

## 🔐 Authentication & Authorization

The application uses Clerk for authentication with database-backed user management:

- **Public Routes**: Landing page, course catalog (read-only)
- **Protected Routes**: Dashboard, course content, user features
- **Admin Routes**: Admin dashboard, user management, course moderation

User roles are managed in the database and synchronized with Clerk authentication.

## 🚀 Deployment

### Firebase App Hosting (Recommended)

1. **Setup Firebase**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init apphosting
   ```

2. **Configure Environment Variables**
   Set up secrets in Firebase Console:
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY`
   - `GEMINI_API_KEY`
   - `YOUTUBE_API_KEY`

3. **Deploy**
   ```bash
   firebase deploy --only apphosting
   ```

### Vercel

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Configure environment variables
   - Deploy automatically on git push

### VPS with Coolify

Refer to `DEPLOYMENT_VPS_COOLIFY.md` for detailed VPS deployment instructions.

## 🔄 Data Migration

If migrating from the localStorage version:

1. **Export Existing Data**
   - Export custom courses from course designer
   - Save important notes and sketches

2. **Setup Database**
   - Follow installation steps above
   - Run database migrations

3. **Import Data**
   - Re-import courses using the course designer
   - Recreate notes and sketches

For detailed migration instructions, see `DATA_PERSISTENCE_MIGRATION.md`.

## 🧪 Development

### Adding New Features

1. **Database Changes**
   - Update `prisma/schema.prisma`
   - Run `npm run db:push`
   - Update types in `src/lib/types.ts`

2. **API Routes**
   - Create route in `src/app/api/`
   - Add service methods in `src/lib/data-service.ts`
   - Test with development server

3. **UI Components**
   - Use ShadCN UI components
   - Follow existing patterns for consistency
   - Add proper TypeScript types

### AI Flow Development

```bash
# Start Genkit development UI
npm run genkit:dev

# Visit http://localhost:4000 for flow testing
```

Create new flows in `src/ai/flows/` and import them in `src/ai/dev.ts`.

## 📊 Monitoring & Analytics

The application includes:
- **User Analytics**: Learning progress, engagement metrics
- **Course Analytics**: Completion rates, popular content
- **Platform Analytics**: User growth, content utilization
- **xAPI Integration**: Learning data tracking and export

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section in `DATA_PERSISTENCE_MIGRATION.md`
- Review server logs for API errors
- Verify environment configuration
- Test with a fresh database setup

## 🔮 Roadmap

- [ ] Real-time collaboration features
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Content recommendation engine
- [ ] Integration with external LMS platforms
- [ ] Offline learning capabilities

---

Built with ❤️ using Next.js, Prisma, and modern web technologies.
