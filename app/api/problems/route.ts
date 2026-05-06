import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: problems, error } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        language,
        test_cases (
          id,
          input,
          expected_output
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching problems:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch problems'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: problems
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch problems'
      },
      { status: 500 }
    )
  }
}
