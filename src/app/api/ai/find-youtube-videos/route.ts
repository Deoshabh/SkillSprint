import { findYoutubeVideosForModule } from '@/ai/flows/find-youtube-videos-flow'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, difficulty = 'beginner', duration = 'medium' } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    const result = await findYoutubeVideosForModule({
      moduleTitle: topic,
      moduleDescription: `A ${difficulty} level module about ${topic} with ${duration} duration content`,
      preferredLanguage: 'English'
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Find YouTube Videos Error:', error)
    return NextResponse.json(
      { error: 'Failed to find YouTube videos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
