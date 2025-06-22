import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SketchesService } from '@/lib/data-service';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sketches = await SketchesService.getUserSketches(userId);
    return NextResponse.json(sketches);
  } catch (error) {
    console.error('Error fetching sketches:', error);
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
    const sketch = await SketchesService.createSketch(userId, data);
    
    return NextResponse.json(sketch, { status: 201 });
  } catch (error) {
    console.error('Error creating sketch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
