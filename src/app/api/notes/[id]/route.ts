import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NotesService } from '@/lib/data-service';

interface Params {
  id: string;
}

export async function PUT(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const note = await NotesService.updateNote(id, userId, data);
    
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<Params> }) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await NotesService.deleteNote(id, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
