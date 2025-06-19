import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      console.log('No auth token found in cookies');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // For development, try connecting to database, but fall back to mock user if DB unavailable
    try {
      const { connectToDatabase, User } = await import('@/lib/mongodb');
      await connectToDatabase();
      
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        return NextResponse.json(user);      }
    } catch (dbError) {
      console.log('Database unavailable, using fallback for development');
    }
    
    // Fallback user structure for development/testing
    const fallbackUser = {
      _id: decoded.userId,
      email: decoded.email,
      name: 'User',
      role: decoded.role || 'user',
      avatar: null,
      preferences: {
        theme: 'light',
        language: 'English'
      }
    };

    return NextResponse.json(fallbackUser);
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
