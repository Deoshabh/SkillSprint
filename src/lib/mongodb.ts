import mongoose from 'mongoose';

import type { UserProfile } from './types';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    // Ensure the connection and db are both available
    if (cached.conn.connection && cached.conn.connection.db) {
      return { 
        conn: cached.conn, 
        db: cached.conn.connection.db 
      };
    } else {
      // Reset cached connection if db is not available
      console.warn('[MongoDB] Cached connection exists but db is not available, resetting...');
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  // Ensure the database is available
  if (!cached.conn.connection || !cached.conn.connection.db) {
    throw new Error('Database connection established but db is not available');
  }

  return { 
    conn: cached.conn, 
    db: cached.conn.connection.db 
  };
}

// User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth users
  profileSetupComplete: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatarUrl: String,
  points: { type: Number, default: 0 },
  // Google OAuth specific fields
  googleId: String,
  emailVerified: { type: Boolean, default: false },
  earnedBadges: [mongoose.Schema.Types.Mixed],
  enrolledCourses: { type: [String], default: [] },  learningPreferences: {
    tracks: [String],
    language: String
  },  customVideoLinks: [{
    id: String,
    title: String,
    url: String,
    description: String,
    dateAdded: Date
  }],
  userModuleVideos: { type: Map, of: [mongoose.Schema.Types.Mixed] },
  userAIVideos: { type: Map, of: [mongoose.Schema.Types.Mixed] },
  userAISearchUsage: { type: Map, of: Number },
  textNotes: [{
    id: String,
    title: String,
    content: String,
    dateCreated: Date,
    tags: [String]
  }],  sketches: [{
    id: String,
    title: String,
    imageData: String,
    dateCreated: Date
  }],
  uploadedImages: [{
    id: String,
    fileName: String,
    fileType: String,
    fileSize: Number,
    dataUrl: String,
    uploadType: String, // 'avatar', 'course', 'content', 'general'
    uploadedAt: Date
  }],
  dailyPlans: { type: Map, of: mongoose.Schema.Types.Mixed },
  submittedFeedback: [mongoose.Schema.Types.Mixed]
}, {
  timestamps: true
});

// Course Schema
const courseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  category: String,
  authorId: String,
  authorName: String,
  imageUrl: String,
  status: { type: String, enum: ['draft', 'pending', 'published', 'rejected'], default: 'draft' },
  visibility: { type: String, enum: ['private', 'shared', 'public'], default: 'private' },
  difficulty: String,
  estimatedHours: Number,
  duration: String,
  suggestedSchedule: String,
  modules: [mongoose.Schema.Types.Mixed],
  tags: [String],
  enrolledStudents: [String],
  ratings: [{
    userId: String,
    rating: Number,
    review: String,
    date: Date
  }],
  enrollmentCount: { type: Number, default: 0 },
  submittedDate: Date,
  lastModified: Date,
  reviewedAt: Date,
  reviewedBy: String,
  reviewReason: String
}, {
  timestamps: true
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  userName: String,
  userEmail: String,
  type: String,
  subject: String,
  message: String,
  courseId: String,
  status: { type: String, enum: ['new', 'in-progress', 'resolved', 'archived'], default: 'new' },
  adminNotes: String,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, {
  timestamps: true
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  userId: String,
  event: String,
  data: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);
