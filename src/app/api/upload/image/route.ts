import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase, User } from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    await connectToDatabase();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const imageType: string = data.get('type') as string; // 'avatar', 'course', 'profile'
    const entityId: string = data.get('entityId') as string; // user ID, course ID, etc.
    const storageMethod: string = data.get('storageMethod') as string || 'database'; // Default to database storage

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let imageUrl: string;

    if (storageMethod === 'database') {
      // Store in database as base64
      const base64String = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64String}`;
      
      // Create image record
      const imageRecord = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataUrl: dataUrl,
        uploadType: imageType || 'general',
        uploadedAt: new Date()
      };

      // Add to user's uploadedImages array
      await User.findByIdAndUpdate(
        decoded.userId,
        { 
          $push: { 
            uploadedImages: imageRecord 
          } 
        },
        { new: true }
      );

      imageUrl = dataUrl;
      
    } else {
      // Store in filesystem (existing logic)
      const uploadDir = join(process.cwd(), 'public', 'uploads', imageType);
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const filename = `${entityId}_${timestamp}.${fileExtension}`;
      const filepath = join(uploadDir, filename);

      // Write file to disk
      await writeFile(filepath, buffer);

      // Generate public URL
      imageUrl = `/uploads/${imageType}/${filename}`;
    }

    // Store image reference in database based on type
    let updateResult;
    if (imageType === 'avatar' && entityId === decoded.userId) {
      // Update user avatar
      updateResult = await User.findByIdAndUpdate(
        decoded.userId,
        { $set: { avatarUrl: imageUrl } },
        { new: true, select: 'avatarUrl' }
      );
    } else if (imageType === 'course') {
      // This would need to be implemented when we have course update API
      // For now, we'll just return the URL
      updateResult = { imageUrl };
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      storageMethod,
      message: 'Image uploaded successfully',
      data: updateResult
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image' 
    }, { status: 500 });  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const url = new URL(request.url);
    const uploadType = url.searchParams.get('type');
    
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('uploadedImages');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let images = user.uploadedImages || [];
    
    // Filter by upload type if specified
    if (uploadType) {
      images = images.filter((img: any) => img.uploadType === uploadType);
    }

    return NextResponse.json({
      success: true,
      images: images.map((img: any) => ({
        id: img.id,
        fileName: img.fileName,
        fileType: img.fileType,
        fileSize: img.fileSize,
        dataUrl: img.dataUrl,
        uploadType: img.uploadType,
        uploadedAt: img.uploadedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { imageUrl, imageType, entityId } = await request.json();
    
    await connectToDatabase();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user has permission to delete this image
    if (imageType === 'avatar' && entityId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Remove from database
    if (imageType === 'avatar' && entityId === decoded.userId) {
      await User.findByIdAndUpdate(
        decoded.userId,
        { $unset: { avatarUrl: "" } },
        { new: true }
      );
    }

    // Note: In production, you might want to also delete the physical file
    // from the filesystem, but be careful about race conditions

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ 
      error: 'Failed to delete image' 
    }, { status: 500 });
  }
}
