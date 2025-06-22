import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserService } from '@/lib/data-service';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const user = await UserService.findByClerkId(userId);
      
      if (user) {
        return NextResponse.json(user);
      } else {
        // Return a default user structure instead of creating in database immediately
        // This avoids the MongoDB replica set requirement for now
        const defaultUser = {
          id: `default_${userId}`,
          clerkId: userId,
          email: 'user@example.com',
          name: 'User',
          role: 'LEARNER',
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          avatarUrl: null,
          earnedBadges: [],
          enrollments: [],
          userProgress: []
        };
        return NextResponse.json(defaultUser);
      }
    } catch (dbError) {
      console.error('Database error, returning default user:', dbError);
      // Return default user structure if database operations fail
      const defaultUser = {
        id: userId,
        clerkId: userId,
        email: 'user@example.com',
        name: 'User',
        role: 'LEARNER',
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        avatarUrl: null,
        earnedBadges: [],
        enrollments: [],
        userProgress: []
      };
      return NextResponse.json(defaultUser);
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const existingUser = await UserService.findByClerkId(userId);
    
    if (existingUser) {
      const updatedUser = await UserService.updateUser(userId, data);
      return NextResponse.json(updatedUser);
    } else {
      try {
        const newUser = await UserService.createUser({
          clerkId: userId,
          ...data
        });
        return NextResponse.json(newUser, { status: 201 });
      } catch (error) {
        console.error('Error creating user, returning default:', error);
        // Return default user structure if creation fails
        const defaultUser = {
          id: userId,
          clerkId: userId,
          email: data.email || 'user@example.com',
          name: data.name || 'User',
          role: data.role || 'LEARNER',
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          avatarUrl: data.avatarUrl || null,
          earnedBadges: [],
          enrollments: [],
          userProgress: []
        };
        return NextResponse.json(defaultUser, { status: 201 });
      }
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const updatedUser = await UserService.updateUserProfile(userId, data);
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
