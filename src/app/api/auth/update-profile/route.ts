import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { validateRequest } from '@/lib/auth-utils';
import { profileUpdateSchema } from '@/lib/validation-utils';
import { createApiResponse } from '@/lib/api-utils';

export async function PUT(request: NextRequest) {
  try {
    // Validate authentication
    const auth = await validateRequest(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid profile data',
          details: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const profileData = validationResult.data;
    
    await connectToDatabase();
    
    // Find user by email or userId depending on auth method
    let userQuery: any = {};
    if (auth.user.email) {
      userQuery = { email: auth.user.email };
    } else if (auth.user.userId) {
      userQuery = { _id: auth.user.userId };
    } else {
      return NextResponse.json({ error: 'Invalid user identification' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      userQuery,
      { $set: profileData },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }    return createApiResponse({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.name,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Profile update failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
