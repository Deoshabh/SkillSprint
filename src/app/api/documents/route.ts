import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { validateFileUpload } from '@/lib/import-utils';

// Document model interface
interface Document {
  _id?: string;
  name: string;
  originalName: string;
  type: 'pdf' | 'doc' | 'docx' | 'txt';
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
  userId: string;
  courseId?: string;
  description?: string;
  isPublic?: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const courseId = formData.get('courseId') as string;
    const description = formData.get('description') as string;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = join(uploadsDir, filename);
    const publicUrl = `/uploads/documents/${filename}`;

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const { db } = await connectToDatabase();
    const document: Document = {
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      originalName: file.name,
      type: fileExtension?.toLowerCase() as 'pdf' | 'doc' | 'docx' | 'txt',
      size: file.size,
      path: filePath,
      url: publicUrl,
      uploadedAt: new Date(),
      userId,
      courseId: courseId || undefined,
      description: description || undefined,
      isPublic: isPublic || false,
      status: 'pending' // All uploads need admin approval
    };

    const result = await db.collection('documents').insertOne(document);

    return NextResponse.json({
      success: true,
      document: {
        id: result.insertedId.toString(),
        ...document
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    const { db } = await connectToDatabase();
    
    // Build query based on parameters
    const query: any = {};
    
    if (!isAdmin) {
      // Non-admin users can only see their own documents or public approved ones
      query.$or = [
        { userId },
        { isPublic: true, status: 'approved' }
      ];
    }
    
    if (courseId) {
      query.courseId = courseId;
    }
    
    if (status && isAdmin) {
      query.status = status;
    }

    const documents = await db
      .collection('documents')
      .find(query)
      .sort({ uploadedAt: -1 })
      .toArray();

    interface DocumentResponse {
        id: string;
        name: string;
        originalName: string;
        type: string;
        size: number;
        url: string;
        uploadedAt: Date;
        userId: string;
        courseId?: string;
        description?: string;
        isPublic?: boolean;
        status: string;
    }

    interface GetDocumentsResponse {
        success: boolean;
        documents: DocumentResponse[];
    }

            return NextResponse.json<GetDocumentsResponse>({
                success: true,
                documents: documents.map((doc: any): DocumentResponse => ({
                    id: doc._id.toString(),
                    name: doc.name,
                    originalName: doc.originalName,
                    type: doc.type,
                    size: doc.size,
                    url: doc.url,
                    uploadedAt: doc.uploadedAt,
                    userId: doc.userId,
                    courseId: doc.courseId,
                    description: doc.description,
                    isPublic: doc.isPublic,
                    status: doc.status
                }))
            });

  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
