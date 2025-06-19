import { NextRequest, NextResponse } from 'next/server';
import { 
  importCourseFile, 
  getImportValidationSummary, 
  type CourseImportPreview 
} from '@/lib/import-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['.yaml', '.yml', '.xlsx', '.xls', '.txt', '.csv'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Unsupported file type. Supported formats: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Parse and validate the file
    const previews = await importCourseFile(file);
    const validationResult = getImportValidationSummary(previews);
    
    return NextResponse.json({
      success: true,
      data: {
        previews,
        validation: validationResult,
        summary: {
          total: validationResult.summary.total,
          valid: validationResult.summary.validCount,
          invalid: validationResult.summary.invalidCount,
          errors: validationResult.summary.errors
        }
      }
    });
    
  } catch (error) {
    console.error('Import validation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to validate import file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
