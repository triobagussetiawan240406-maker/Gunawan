import { NextRequest, NextResponse } from 'next/server'
import { runCode } from '@/lib/feedback-engine'

interface RunRequest {
  code: string
  language: 'python' | 'javascript'
  input?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RunRequest = await request.json()
    const language = body.language === 'javascript' ? 'javascript' : 'python'
    const input = body.input ?? ''

    const result = await runCode(body.code, input, language)

    return NextResponse.json({
      success: true,
      output: result.output,
      error: result.error
    })
  } catch (error) {
    console.error('Run API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menjalankan kode'
      },
      { status: 500 }
    )
  }
}
