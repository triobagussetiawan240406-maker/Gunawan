'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ensureUserProfile, getUserProfile } from '@/lib/profile'
import { Button } from '@/components/Button'
import { Card, CardBody, CardHeader } from '@/components/Card'
import toast from 'react-hot-toast'
import { Mail, Lock } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Email dan password harus diisi')
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Get or create user profile
      const profileResult = await getUserProfile(data.user.id)

      let userRole = 'student'

      if (!profileResult.exists) {
        // Create profile if it doesn't exist
        const createResult = await ensureUserProfile(
          data.user.id,
          data.user.user_metadata?.full_name || 'User',
          'student'
        )
        userRole = createResult.profile?.role || 'student'
      } else {
        userRole = profileResult.profile?.role || 'student'
      }

      toast.success('Login berhasil!')
      router.push(userRole === 'admin' ? '/admin' : '/dashboard')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login gagal'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h1 className="text-2xl font-bold">Login</h1>
            <p className="text-sm opacity-90 mt-1">Masuk ke akun Anda</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </div>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" loading={loading} size="lg" className="w-full">
                Login
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Daftar di sini
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
