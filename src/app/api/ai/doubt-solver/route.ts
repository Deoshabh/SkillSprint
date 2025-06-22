import { doubtSolver } from '@/ai/flows/doubt-solver-flow'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, context } = body

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const result = await doubtSolver({
      query: context ? `Context: ${context}\n\nQuestion: ${question}` : question,
      chatHistory: []
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Doubt Solver Error:', error)
    return NextResponse.json(
      { error: 'Failed to solve doubt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
