import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NotesService, DatabaseHelpers } from '@/lib/data-service';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert Clerk ID to MongoDB User ID
    const mongoUserId = await DatabaseHelpers.getMongoUserIdFromClerkId(userId);
    if (!mongoUserId) {
      // Return empty array if user doesn't exist in database yet
      return NextResponse.json([]);
    }

    const notes = await NotesService.getUserNotes(mongoUserId);
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const data = await request.json();
    const note = await NotesService.createNote(mongoUserId, data);
    
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
