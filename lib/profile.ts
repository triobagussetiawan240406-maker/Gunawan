import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Ensure user profile exists, create if doesn't (with retry)
 */
export async function ensureUserProfile(
  userId: string,
  fullName: string = 'User',
  role: 'student' | 'admin' = 'student'
) {
  try {
    // First, check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (existingProfile) {
      console.log('Profile already exists for user:', userId)
      return { success: true, created: false, profile: existingProfile }
    }

    // If not found and no error, create profile
    if (!checkError || checkError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          role
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create profile:', createError)
        // Retry once if creation fails
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: retryProfile, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (retryError) {
          throw retryError
        }
        return { success: true, created: true, profile: retryProfile }
      }

      console.log('Profile created for user:', userId)
      return { success: true, created: true, profile: newProfile }
    }

    throw checkError
  } catch (error) {
    console.error('ensureUserProfile error:', error)
    return { success: false, error }
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist
        console.log('Profile not found for user:', userId)
        return { exists: false, profile: null }
      }
      console.error('getUserProfile error:', error)
      throw error
    }

    return { exists: true, profile: data }
  } catch (error) {
    console.error('getUserProfile error:', error)
    return { exists: false, profile: null, error }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { full_name?: string; role?: string }
) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, profile: data }
  } catch (error) {
    console.error('updateUserProfile error:', error)
    return { success: false, error }
  }
}
