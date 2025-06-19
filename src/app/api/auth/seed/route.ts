import { NextResponse } from 'next/server';

// Demo seeding endpoint removed for production
export async function POST() {
  return NextResponse.json({ 
    success: false, 
    message: 'Demo seeding disabled in production' 
  }, { status: 404 });
}

export async function GET() {
  return POST(); // Allow both POST and GET for convenience
}
