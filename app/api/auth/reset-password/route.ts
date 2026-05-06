import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPasswordResetEmail } from '@/lib/smtp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}


export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Generate reset link dari Supabase auth
    const { data, error } = await supabase.auth.admin.generateLink({

      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/update-password`
      }
    })

    if (error || !data?.properties) {
      console.error('Failed to generate reset link:', error)
      return NextResponse.json(
        { error: 'Failed to generate reset link' },
        { status: 500 }
      )
    }

    // Get recovery link
    const resetLink = (data.properties as any).action_link || (data.properties as any).recovery_link || (data.properties as any).link
    
    if (!resetLink) {
      console.error('No recovery link in response')
      return NextResponse.json(
        { error: 'Failed to generate reset link' },
        { status: 500 }
      )
    }

    // Kirim email reset password
    await sendPasswordResetEmail(email, resetLink)

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
