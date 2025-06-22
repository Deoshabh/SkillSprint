import { generateQuiz } from '@/ai/flows/ai-quiz-generator'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, difficulty = 'intermediate', questionCount = 5 } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    const result = await generateQuiz({
      courseModuleContent: `Topic: ${topic}\nDifficulty: ${difficulty}`,
      numberOfQuestions: questionCount
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('AI Quiz Generator Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
