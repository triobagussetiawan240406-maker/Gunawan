import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: any) {
        cookieStore.delete(name)
      },
    },
  })
}

export function createServerSupabaseClientWithToken(accessToken: string | null) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
      },
    },
  })
}
