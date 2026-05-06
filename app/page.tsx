'use client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Card, CardBody } from '@/components/Card'
import { CodeIcon, Zap, Brain, ShieldCheck, Sparkles, Smartphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    fetchUser()
  }, [])

  const features = [
    {
      icon: CodeIcon,
      title: 'Editor Canggih',
      description: 'Tulis dan jalankan kode dengan editor modern berteknologi Monaco Editor.',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      icon: Zap,
      title: 'Evaluasi Otomatis',
      description: 'Sistem test case canggih dengan feedback real-time dan analisis mendalam.',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      icon: Brain,
      title: 'AI Feedback Pintar',
      description: 'Dapatkan saran perbaikan cerdas dari AI untuk meningkatkan skill coding Anda.',
      gradient: 'from-green-500 to-teal-600'
    },
    {
      icon: ShieldCheck,
      title: 'Platform Aman',
      description: 'Environment terisolasi dengan keamanan tinggi untuk menjalankan kode.',
      gradient: 'from-red-500 to-pink-600'
    },
    {
      icon: Sparkles,
      title: 'Dual Mode Learning',
      description: 'Mode Run Code untuk eksplorasi bebas dan Submit Problem untuk evaluasi.',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Pengalaman coding yang optimal di semua device dengan UI modern.',
      gradient: 'from-cyan-500 to-blue-600'
    }
  ]

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-16">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold gradient-text animate-pulse">
            Code Evaluator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Platform e-learning modern untuk belajar pemrograman dengan evaluasi otomatis,
            feedback AI cerdas, dan pengalaman coding yang luar biasa.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {!loading && (
            user ? (
              <Link href="/dashboard">
                <Button size="lg" className="glass hover:bg-white/20 px-8 py-4 text-lg font-semibold pulse-glow">
                  🚀 Mulai Coding
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="glass hover:bg-white/20 px-8 py-4 text-lg font-semibold">
                    📝 Daftar Sekarang
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="glass border-white/30 hover:bg-white/10 px-8 py-4 text-lg">
                    🔑 Masuk
                  </Button>
                </Link>
              </>
            )
          )}
        </div>

        {/* Animated Code Preview */}
        <div className="glass rounded-2xl p-6 max-w-2xl mx-auto mt-12 float">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-400 ml-4">Python • main.py</span>
          </div>
          <pre className="text-left text-sm font-mono text-gray-300">
            <code>{`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Test the function
print(fibonacci(10))  # Output: 55`}</code>
          </pre>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold gradient-text">Fitur Unggulan</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Teknologi terdepan untuk pengalaman belajar coding yang revolusioner
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="glass hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardBody className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="glass rounded-3xl p-8 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <div className="text-3xl font-bold gradient-text">100+</div>
            <div className="text-gray-400">Soal Coding</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold gradient-text">AI</div>
            <div className="text-gray-400">Feedback Pintar</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold gradient-text">2</div>
            <div className="text-gray-400">Bahasa Support</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold gradient-text">24/7</div>
            <div className="text-gray-400">Platform Online</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-16">
        <h2 className="text-4xl font-bold text-white">Siap Mulai Petualangan Coding?</h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Bergabunglah dengan ribuan developer yang telah meningkatkan skill mereka di platform kami
        </p>
        {!loading && !user && (
          <Link href="/register">
            <Button size="lg" className="animated-border text-white px-12 py-4 text-lg font-semibold hover:shadow-2xl">
              🎯 Mulai Sekarang - Gratis!
            </Button>
          </Link>
        )}
      </section>
    </div>
  )
}