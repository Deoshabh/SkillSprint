import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase, User } from '@/lib/mongodb';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { courseId, moduleId, action, pointsAwarded } = await request.json();
    
    await connectToDatabase();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {};

    if (action === 'complete_module') {
      // Add completed module to user's progress
      const currentModules = user.userModuleVideos?.[courseId] || [];
      if (!currentModules.includes(moduleId)) {
        updateData[`userModuleVideos.${courseId}`] = [...currentModules, moduleId];        
        // Award points for completing module
        updateData.points = (user.points || 0) + (pointsAwarded || 100);
      }
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, select: '-password' }
    );    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      user: {
        userModuleVideos: updatedUser.userModuleVideos ? Object.fromEntries(updatedUser.userModuleVideos) : {},
        points: updatedUser.points,
        earnedBadges: updatedUser.earnedBadges
      }
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
