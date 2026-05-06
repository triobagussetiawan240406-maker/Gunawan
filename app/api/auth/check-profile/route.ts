import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    // Prevent build-time crashes when env vars are missing.
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}



export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }

    // Check if profile exists
    const { data: profile, error } = await supabase

      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist
        return NextResponse.json({
          exists: false,
          message: 'Profile tidak ditemukan'
        })
      }
      throw error
    }

    return NextResponse.json({
      exists: true,
      profile
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, role = 'student' } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured'
      }, { status: 500 })
    }

    // Create profile if it doesn't exist
    const { data: profile, error } = await supabase

      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName || 'User',
        role
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      profile
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
