import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase, User } from '@/lib/mongodb';

// Force dynamic rendering to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).select('dailyPlans');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      dailyPlans: user.dailyPlans || {}
    });
  } catch (error) {
    console.error('Error fetching daily plans:', error);
    return NextResponse.json({ error: 'Failed to fetch daily plans' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    await connectToDatabase();
      // Check if this is a task completion update or full daily plans update
    if (body.taskId && typeof body.completed === 'boolean') {
      // Handle individual task completion update
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const dailyPlans = user.dailyPlans || {};
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = dailyPlans[today] || [];
      
      // Update the specific task
      const updatedTasks = todayTasks.map((task: any) => 
        task.id === body.taskId ? { ...task, isCompleted: body.completed } : task
      );
      
      dailyPlans[today] = updatedTasks;
      
      const updatedUser = await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { dailyPlans } },
        { new: true, select: '-password' }
      );

      return NextResponse.json({
        success: true,
        message: 'Task completion updated successfully',
        dailyPlans: updatedUser.dailyPlans
      });
    } else {      // Handle full daily plans update
      const { dailyPlans } = body;
      
      const updatedUser = await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { dailyPlans } },
        { new: true, select: '-password' }
      );

      if (!updatedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Daily plans updated successfully',
        dailyPlans: updatedUser.dailyPlans
      });
    }
  } catch (error) {
    console.error('Error updating daily plans:', error);
    return NextResponse.json({ error: 'Failed to update daily plans' }, { status: 500 });
  }
}
