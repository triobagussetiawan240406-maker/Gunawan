import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientWithToken } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = authHeader.substring(7)
    const supabase = createServerSupabaseClientWithToken(accessToken)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Submission deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
