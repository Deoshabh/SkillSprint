import { AuthOptions } from 'next-auth';

import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { connectToDatabase } from './mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

/**
 * NextAuth Configuration for SkillSprint
 * 
 * Supports:
 * - Google OAuth (primary authentication method)
 * - Credentials-based authentication (email/password)
 * - MongoDB integration with fallback for offline development
 * 
 * Roles: 'admin' | 'user'
 */

// Create MongoDB client for NextAuth adapter
let mongoClient: any = null;

async function getMongoClient() {
  if (!mongoClient) {
    try {
      await connectToDatabase();
      mongoClient = mongoose.connection.getClient();
    } catch (error) {
      console.log('MongoDB unavailable for NextAuth adapter');
      return null;
    }
  }
  return mongoClient;
}

export const authOptions: AuthOptions = {
  // MongoDB adapter for session storage (optional - using JWT strategy)
  // adapter: MongoDBAdapter(getMongoClient()),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user' // Default role for new Google OAuth users
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Try database first
          const { User } = await import('./mongodb');
          await connectToDatabase();
          
          const user = await User.findOne({ email: credentials.email });
          if (user) {
            const isValidPassword = await bcrypt.compare(credentials.password, user.password);
            if (isValidPassword) {
              return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                image: user.avatarUrl || null
              };
            }
          }        } catch (dbError) {
          console.error('Database error during authentication:', dbError);
          return null;
        }

        return null;
      }
    })
  ],
  callbacks: {    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token;
        token.role = user.role || 'user';
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.accessToken = token.accessToken as string;
        session.user.role = token.role as string;
        session.user.id = token.userId as string;
      }
      return session;    },    async signIn({ user, account }) {
      // Handle Google OAuth and credential-based authentication
      try {
        // Check if user exists in database, if not create them
        const { User } = await import('./mongodb');
        await connectToDatabase();
        
        let dbUser = await User.findOne({ email: user.email });
        
        if (!dbUser) {
          // Create new user for Google OAuth or other providers
          const isGoogleOAuth = account?.provider === 'google';
          
          dbUser = new User({
            id: Date.now().toString(),
            name: user.name,
            email: user.email,
            password: isGoogleOAuth ? '' : undefined, // No password for OAuth users
            profileSetupComplete: false,
            role: 'user', // Default role for new users
            avatarUrl: user.image || '',
            points: 0,
            earnedBadges: [],
            enrolledCourses: [],
            learningPreferences: {
              tracks: [],
              language: 'english'
            },
            customVideoLinks: [],
            userModuleVideos: {},
            textNotes: [],
            sketches: [],
            uploadedImages: [],
            dailyPlans: {},
            submittedFeedback: [],
            // Google OAuth specific fields
            ...(isGoogleOAuth && {
              googleId: account.providerAccountId,
              emailVerified: true
            })
          });
          
          await dbUser.save();
          console.log(`New ${account?.provider || 'credentials'} user created:`, user.email);
        } else if (account?.provider === 'google' && !dbUser.googleId) {
          // Link Google account to existing user
          dbUser.googleId = account.providerAccountId;
          dbUser.avatarUrl = user.image || dbUser.avatarUrl;
          dbUser.emailVerified = true;
          await dbUser.save();
          console.log('Google account linked to existing user:', user.email);
        }
        
        // Update user info from database
        user.role = dbUser.role;
        user.id = dbUser._id.toString();
        
      } catch (error) {
        console.log('Database unavailable, using fallback authentication');
        // Allow signin even if database is unavailable
        user.role = 'user';
        user.id = Date.now().toString();
      }
      
      return true;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    }
  }
};
