import { autoGenerateCourseSyllabus } from '@/ai/flows/auto-generate-course-syllabus'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseTitle, targetAudience = 'Beginner developers', duration = '4 weeks' } = body

    if (!courseTitle) {
      return NextResponse.json(
        { error: 'Course title is required' },
        { status: 400 }
      )
    }

    const result = await autoGenerateCourseSyllabus({
      courseTopic: courseTitle,
      targetAudience,
      learningObjectives: `Learn ${courseTitle}, practical application, project-based learning`,
      desiredNumberOfModules: 6
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Auto Generate Course Syllabus Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate course syllabus', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
