import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServerSupabaseClientWithToken } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
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

    const problemId = request.nextUrl.searchParams.get('problemId')

    let query = supabaseServer
      .from('submissions')
      .select(`
        id,
        user_id,
        problem_id,
        code,
        result,
        created_at,
        problems (
          title,
          language
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (problemId) {
      query = query.eq('problem_id', problemId)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch submissions'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: submissions
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch submissions'
      },
      { status: 500 }
    )
  }
}
