import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServerSupabaseClientWithToken } from '@/lib/supabase-server'
import { runCode, generateFeedback } from '@/lib/feedback-engine'

interface SubmitRequest {
  code: string
  problemId: string
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '') ?? null
    const supabaseServer = accessToken
      ? createServerSupabaseClientWithToken(accessToken)
      : await createServerSupabaseClient()

    const userResult = accessToken
      ? await supabaseServer.auth.getUser(accessToken)
      : await supabaseServer.auth.getUser()

    const { data: { user }, error: authError } = userResult

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      )
    }

    const body: SubmitRequest = await request.json()
    const { code, problemId } = body

    // Get test cases for the problem
    const { data: problem, error: problemError } = await supabaseServer
      .from('problems')
      .select('language')
      .eq('id', problemId)
      .single()

    if (problemError || !problem) {
      console.error('Error fetching problem:', problemError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch problem details'
        },
        { status: 500 }
      )
    }

    const { data: testCases, error: testCaseError } = await supabaseServer
      .from('test_cases')
      .select('id, input, expected_output')
      .eq('problem_id', problemId)

    if (testCaseError || !testCases) {
      console.error('Error fetching test cases:', testCaseError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch test cases'
        },
        { status: 500 }
      )
    }

    // Run tests
    const results = []
    for (const testCase of testCases) {
      const { output, error } = await runCode(code, testCase.input, problem.language)
      results.push({
        test_id: testCase.id,
        passed: output.trim() === testCase.expected_output.trim(),
        input: testCase.input,
        output: output || error || '',
        expected: testCase.expected_output
      })
    }

    const passedCount = results.filter((r) => r.passed).length
    const feedback = await generateFeedback(results, code)

    // Save submission to database
    const submissionData = {
      user_id: user.id,
      problem_id: problemId,
      code,
      result: {
        passed: passedCount,
        total: testCases.length,
        status: passedCount === testCases.length ? 'passed' : 'failed',
        details: results
      }
    }

    const { error: insertError } = await supabaseServer
      .from('submissions')
      .insert(submissionData)

    if (insertError) {
      console.error('Error saving submission:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save submission'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      feedback,
      result: {
        passed: passedCount,
        total: testCases.length,
        status: passedCount === testCases.length ? 'passed' : 'failed',
        details: results
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit code'
      },
      { status: 500 }
    )
  }
}
