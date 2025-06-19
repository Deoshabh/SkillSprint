import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    let dbStatus = 'ok';
    try {
      const { conn } = await connectToDatabase();
      if (!conn) {
        dbStatus = 'unavailable';
      }
    } catch (error) {
      dbStatus = 'error';
    }

    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      runtime: process.env.RUNTIME || 'false',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: dbStatus,
        api: 'ok'
      }
    };

    const responseStatus = dbStatus === 'ok' ? 200 : 503;
    return NextResponse.json(healthCheck, { status: responseStatus });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed' 
      }, 
      { status: 500 }
    );
  }
}
