import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '@/lib/smtp'

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

    // Generate verification link dari Supabase auth
    const { data, error } = await supabase.auth.admin.generateLink({

      type: 'invite',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
      }
    })

    if (error || !data?.properties) {
      console.error('Failed to generate verification link:', error)
      return NextResponse.json(
        { error: 'Failed to generate verification link' },
        { status: 500 }
      )
    }

    // Get verification link
    const verificationLink = (data.properties as any).action_link || (data.properties as any).link
    
    if (!verificationLink) {
      console.error('No verification link in response')
      return NextResponse.json(
        { error: 'Failed to generate verification link' },
        { status: 500 }
      )
    }

    // Kirim email verifikasi
    await sendVerificationEmail(email, verificationLink)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
