# Course Import/Export Documentation

## Overview

The SkillSprint platform provides comprehensive import/export functionality for course content, enabling administrators to efficiently manage course data in bulk. This feature supports JSON format for both import and export operations.

## Features

### Export Functionality

#### Export Types
1. **Single Course Export**: Export individual courses
2. **Bulk Export**: Export selected courses
3. **All Courses Export**: Export all courses from the platform

#### Export Options
- **Include User Data**: Choose whether to include enrollment data, ratings, and progress
- **Format**: JSON (primary format, additional formats can be added)

#### API Endpoints
- `GET /api/courses/export/[courseId]` - Export single course
- `POST /api/courses/export` - Bulk export selected courses
- `POST /api/courses/export/all` - Export all courses

### Import Functionality

#### Import Features
- **Validation**: Pre-import validation ensures data integrity
- **Multiple Import Modes**:
  - Create Only: Skip existing courses
  - Update Only: Update existing courses only
  - Create or Update: Recommended mode for most scenarios
- **Error Handling**: Detailed error reporting for failed imports
- **Progress Tracking**: Real-time import progress display

#### Import Process
1. **File Upload**: Select JSON export file
2. **Validation**: Automatic validation of import data
3. **Options Configuration**: Choose import mode and settings
4. **Import Execution**: Process courses with detailed feedback
5. **Results Review**: Summary of import results with error details

#### API Endpoints
- `POST /api/courses/import/validate` - Validate import data
- `POST /api/courses/import` - Execute course import

## Export Data Format

### Export JSON Structure
```json
{
  "metadata": {
    "exportedAt": "2024-01-15T10:30:00.000Z",
    "exportedBy": "admin",
    "version": "1.0.0",
    "platform": "SkillSprint",
    "includeUserData": false,
    "courseCount": 2,
    "exportType": "bulk" // or "single" or "all_courses"
  },
  "courses": [
    {
      "id": "course-123",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming",
      "category": "Programming",
      "instructor": "John Doe",
      "authorId": "admin-123",
      "authorName": "Admin User",
      "imageUrl": "https://example.com/course-image.jpg",
      "status": "published",
      "difficulty": "beginner",
      "estimatedHours": 20,
      "visibility": "public",
      "tags": ["programming", "beginner", "introduction"],
      "modules": [
        {
          "id": "module-1",
          "title": "Getting Started",
          "description": "Introduction to programming concepts",
          "content": "Module content here...",
          "videoLinks": [
            {
              "title": "Welcome Video",
              "url": "https://youtube.com/watch?v=example",
              "duration": "10:30"
            }
          ],
          "isCompleted": false
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "originalId": "507f1f77bcf86cd799439011"
    }
  ]
}
```

### Single Course Export Format
For single course exports, the structure is similar but uses a `course` object instead of `courses` array:
```json
{
  "metadata": { ... },
  "course": { ... }
}
```

## Usage Guide

### For Administrators

#### Exporting Courses

1. **Access Admin Dashboard**: Navigate to `/admin/course-designer`
2. **Select Export Type**:
   - **All Courses**: Click "Export All Courses" without selecting any courses
   - **Selected Courses**: Use checkboxes to select specific courses, then click "Export Selected (X)"
3. **Configure Export Options**:
   - Choose whether to include user data
   - Select export format (JSON)
4. **Download**: The export file will be automatically downloaded

#### Importing Courses

1. **Access Import Dialog**: Click "Import Courses" in the admin dashboard
2. **Upload File**: Select a JSON export file from SkillSprint
3. **Review Validation**: Check validation results and fix any errors
4. **Configure Import Options**:
   - **Import Mode**: Choose create, update, or create/update
   - **Settings**: Configure update behavior and ID preservation
5. **Execute Import**: Review import results and handle any errors

### Import Modes Explained

#### Create Only
- Only creates new courses
- Skips courses that already exist (matched by title)
- Safe for adding new content without modifying existing courses

#### Update Only
- Only updates existing courses
- Skips courses that don't exist in the system
- Useful for updating course content without creating duplicates

#### Create or Update (Recommended)
- Creates new courses and updates existing ones
- Most flexible option for general use
- Automatically handles both scenarios

### Best Practices

#### Before Exporting
1. **Review Course Status**: Ensure courses are in the desired state
2. **User Data Consideration**: Decide if user data should be included
3. **Backup**: Consider this as part of your backup strategy

#### Before Importing
1. **Backup Database**: Always backup before large imports
2. **Test with Small Dataset**: Try importing a few courses first
3. **Review File Format**: Ensure the JSON structure matches expected format
4. **Check Permissions**: Verify admin permissions are in place

#### Error Handling
1. **Validation Errors**: Fix data format issues before importing
2. **Import Errors**: Review individual course errors in the results
3. **Partial Imports**: Handle successful and failed imports appropriately

## Technical Details

### File Format Requirements
- **Format**: JSON only
- **Encoding**: UTF-8
- **Maximum Size**: No explicit limit (reasonable file sizes recommended)
- **Structure**: Must match SkillSprint export format

### Security Considerations
- Import/Export restricted to admin users only
- File validation prevents malicious data injection
- User data can be excluded from exports for privacy

### Error Codes
- `400`: Invalid import data or missing required fields
- `404`: Course not found (for single course export)
- `500`: Server error during import/export process

### Validation Rules
- **Required Fields**: title, description, category, instructor
- **Data Types**: Proper type validation for all fields
- **Modules**: Valid module structure with required fields
- **IDs**: Proper ID format and uniqueness

## Troubleshooting

### Common Export Issues
1. **No Courses Found**: Verify courses exist and are accessible
2. **Download Fails**: Check browser settings and popup blockers
3. **Large Files**: Consider exporting in smaller batches

### Common Import Issues
1. **Validation Fails**: Review error messages and fix data format
2. **Duplicate Courses**: Choose appropriate import mode
3. **Permission Denied**: Verify admin access and authentication
4. **Module Errors**: Check module structure and required fields

### File Format Issues
1. **Invalid JSON**: Validate JSON syntax
2. **Missing Metadata**: Ensure metadata section is present
3. **Wrong Structure**: Verify courses array or course object structure
4. **Encoding Issues**: Ensure UTF-8 encoding

## Future Enhancements

### Planned Features
1. **CSV Export**: Additional export format for spreadsheet compatibility
2. **Incremental Import**: Import only changed courses
3. **Template Export**: Export course templates without content
4. **Media Export**: Include course images and media files
5. **Automated Backups**: Scheduled exports for backup purposes

### API Improvements
1. **Authentication**: Integration with JWT-based admin authentication
2. **Rate Limiting**: Prevent abuse of export/import endpoints
3. **Progress Tracking**: Real-time progress for large imports
4. **Resume Capability**: Resume interrupted imports

## Support

For technical support or questions about the import/export functionality:
1. Check this documentation first
2. Review validation error messages
3. Test with smaller datasets
4. Contact system administrator for assistance

---

*Last Updated: January 2024*
*Version: 1.0.0*
