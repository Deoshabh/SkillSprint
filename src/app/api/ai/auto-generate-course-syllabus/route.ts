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

    // Check if AI service is available
    const hasValidApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!hasValidApiKey) {
      return NextResponse.json(
        { 
          error: 'AI service not configured', 
          message: 'Please configure GEMINI_API_KEY to use AI features',
          fallback: `# ${courseTitle} Course Syllabus\n\n**Target Audience:** ${targetAudience}\n**Duration:** ${duration}\n\n## Course Overview\nThis course will cover ${courseTitle} fundamentals and practical applications.\n\n## Module 1: Introduction\n- Course overview\n- Setting up development environment\n\n## Module 2: Core Concepts\n- Fundamental principles\n- Best practices\n\n## Module 3: Practical Application\n- Hands-on exercises\n- Real-world examples\n\n## Module 4: Advanced Topics\n- Advanced techniques\n- Performance optimization\n\n## Module 5: Project Development\n- Capstone project\n- Code review and feedback\n\n## Module 6: Conclusion\n- Course summary\n- Next steps and resources`
        },
        { status: 200 }
      )
    }    // Dynamically import the AI flow to avoid build-time initialization issues
    const { autoGenerateCourseSyllabus } = await import('@/ai/flows/auto-generate-course-syllabus')
    
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
    
    // Provide a fallback response if AI fails
    const { courseTitle = 'Unknown Course' } = await request.json().catch(() => ({}))
    
    return NextResponse.json(
      { 
        error: 'Failed to generate course syllabus', 
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: `# ${courseTitle} Course Syllabus\n\nAI generation failed. Please try again later or create the syllabus manually.`
      },
      { status: 500 }
    )
  }
}
