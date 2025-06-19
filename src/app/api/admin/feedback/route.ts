import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase, Feedback } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    // Get all feedback
    const feedback = await Feedback.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Admin feedback fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }
    
    const { feedbackId, status, adminNotes } = await request.json();
    
    await connectToDatabase();
    
    // Update feedback
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { 
        status,
        adminNotes,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      feedback: updatedFeedback
    });
  } catch (error) {
    console.error('Admin feedback update error:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}
