'use client'
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)

      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, role, created_at, updated_at')
          .eq('id', data.user.id)
          .single()

        setProfile(profileData)
      }
    }

    fetchUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10 shadow-2xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="text-2xl font-bold gradient-text hover:scale-105 transition-transform"
          >
            🚀 Code Evaluator
          </Link>

          <button
            className="lg:hidden text-white hover:text-blue-300 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className={`lg:flex lg:items-center ${mobileOpen ? 'block' : 'hidden'}`}>
            <div className="flex flex-col gap-2 lg:flex-row lg:gap-4 lg:items-center text-sm">
              <Link
                href="/"
                className={`px-4 py-2 rounded-xl transition-all hover:bg-white/10 ${
                  pathname === '/' ? 'bg-white/20 text-white font-semibold' : 'text-gray-300 hover:text-white'
                }`}
              >
                🏠 Beranda
              </Link>
              {user && profile?.role === 'student' && (
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-xl transition-all hover:bg-white/10 ${
                    pathname === '/dashboard' ? 'bg-white/20 text-white font-semibold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  📊 Dashboard
                </Link>
              )}
              {user && profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-xl transition-all hover:bg-white/10 ${
                    pathname === '/admin' ? 'bg-white/20 text-white font-semibold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  ⚙️ Admin Panel
                </Link>
              )}
              {!user && (
                <>
                  <Link
                    href="/login"
                    className={`px-4 py-2 rounded-xl transition-all hover:bg-white/10 ${
                      pathname === '/login' ? 'bg-white/20 text-white font-semibold' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    🔑 Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    📝 Daftar
                  </Link>
                </>
              )}
              {user && (
                <div className="flex flex-col gap-2 lg:flex-row lg:gap-3 lg:items-center">
                  <div className="text-xs lg:text-sm px-3 py-2 rounded-xl bg-white/10 text-gray-300">
                    {profile?.role === 'admin' ? '👨‍💼 Admin' : '👨‍🎓 Mahasiswa'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
