import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { MessagingService, DatabaseHelpers } from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert Clerk ID to MongoDB User ID
    const mongoUserId = await DatabaseHelpers.getMongoUserIdFromClerkId(userId);
    if (!mongoUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    const user = await DatabaseHelpers.ensureUserExists(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, allow any authenticated user to send messages
    // In production, you might want to restrict this to admins only
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const messageData = await request.json();
    
    // Create the message
    const message = await MessagingService.createMessage(mongoUserId, {
      subject: messageData.subject,
      body: messageData.body,
      targetSegment: messageData.targetSegment,
      targetFilters: messageData.targetFilters,
      templateId: messageData.templateId,
      scheduledFor: messageData.scheduledFor ? new Date(messageData.scheduledFor) : undefined
    });

    // If not scheduled, send immediately
    if (!messageData.scheduledFor) {
      const result = await MessagingService.sendMessage(message.id);
      
      return NextResponse.json({
        message,
        sendResult: result
      });
    } else {
      return NextResponse.json({ message });
    }

  } catch (error) {
    console.error('Error in messaging API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert Clerk ID to MongoDB User ID
    const mongoUserId = await DatabaseHelpers.getMongoUserIdFromClerkId(userId);
    if (!mongoUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const messages = await MessagingService.getAllMessages(mongoUserId);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
