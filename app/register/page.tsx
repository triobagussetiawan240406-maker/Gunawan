'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ensureUserProfile } from '@/lib/profile'
import { Button } from '@/components/Button'
import { Card, CardBody, CardHeader } from '@/components/Card'
import toast from 'react-hot-toast'
import { User, Mail, Lock } from 'lucide-react'

export default function Register() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Semua field harus diisi')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'student'
          }
        }
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Create profile with student role
      if (data.user) {
        const profileResult = await ensureUserProfile(
          data.user.id,
          name,
          'student'
        )

        if (!profileResult.success) {
          console.error('Profile creation error:', profileResult.error)
          toast.error('Akun berhasil dibuat, tapi profil perlu disetup di login')
        }
      }

      toast.success('Registrasi berhasil! Silakan login.')
      router.push('/login')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registrasi gagal'
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
            <h1 className="text-2xl font-bold">Daftar</h1>
            <p className="text-sm opacity-90 mt-1">Buat akun baru Anda</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama Lengkap
                  </div>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama Anda"
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Konfirmasi Password
                  </div>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">ℹ️ Catatan:</span> Anda mendaftar sebagai mahasiswa. Untuk akun admin, hubungi administrator.
                </p>
              </div>

              <Button type="submit" loading={loading} size="lg" className="w-full">
                Daftar
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Login di sini
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
