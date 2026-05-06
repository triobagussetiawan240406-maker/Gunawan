'use client'
export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Problem, Submission, Feedback } from '@/lib/types'
import { Card, CardBody, CardHeader, CardFooter } from '@/components/Card'
import { CodeEditor } from '@/components/CodeEditor'
import { SubmissionHistory } from '@/components/SubmissionHistory'
import { Button } from '@/components/Button'
import toast from 'react-hot-toast'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [latestResult, setLatestResult] = useState<Submission['result'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<'run' | 'submit'>('run')
  const [language, setLanguage] = useState<'python' | 'javascript'>('python')
  const [stdinInput, setStdinInput] = useState('')
  const [runOutput, setRunOutput] = useState('')
  const [runError, setRunError] = useState('')
  const [outputLayout, setOutputLayout] = useState<'side' | 'bottom'>('side')

  const fetchSubmissions = useCallback(async (problemId?: string) => {
    try {
      const session = await supabase.auth.getSession()
      const accessToken = session.data?.session?.access_token
      const url = problemId ? `/api/submissions?problemId=${problemId}` : '/api/submissions'
      const response = await fetch(url, {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : ''
        }
      })
      const result = await response.json()
      if (result.success) {
        setSubmissions(result.data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }, [])

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/problems')
      const result = await response.json()
      if (result.success) {
        setProblems(result.data)
        if (result.data.length > 0) {
          const first = result.data[0]
          setSelectedProblem(first)
          setLanguage(first.language)
          await fetchSubmissions(first.id)
        }
      }
    } catch (error) {
      console.error('Error fetching problems:', error)
      toast.error('Gagal memuat soal')
    } finally {
      setLoading(false)
    }
  }, [fetchSubmissions])

  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
        return
      }

      // Check user role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (error || profile?.role !== 'student') {
        toast.error('Akses ditolak. Halaman ini hanya untuk mahasiswa.')
        router.push('/login')
        return
      }

      await fetchProblems()
    }

    void initialize()
  }, [router, fetchProblems])

  const handleSubmit = async () => {
    if (!selectedProblem || !code.trim()) {
      toast.error('Pilih soal dan tulis kode terlebih dahulu')
      return
    }

    setSubmitting(true)
    try {
      const session = await supabase.auth.getSession()
      const accessToken = session.data?.session?.access_token
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify({
          code,
          problemId: selectedProblem.id
        })
      })
      const result = await response.json()
      if (result.success) {
        setFeedback(result.feedback)
        setLatestResult(result.result)
        await fetchSubmissions(selectedProblem.id)
        if (result.result.status === 'passed') {
          toast.success('Semua test case lolos! 🎉')
        } else {
          toast.error(`${result.result.passed}/${result.result.total} test case lolos`)
        }
      } else {
        toast.error(result.error || 'Evaluasi gagal')
      }
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error('Error saat submit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Tulis kode terlebih dahulu')
      return
    }
    setSubmitting(true)
    setRunOutput('')
    setRunError('')

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          input: stdinInput
        })
      })
      const result = await response.json()
      if (result.success) {
        setRunOutput(result.output || '')
        setRunError(result.error || '')
        if (!result.error) {
          toast.success('Kode berhasil dijalankan')
        }
      } else {
        setRunError(result.error || 'Gagal menjalankan kode')
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Run error:', error)
      setRunError('Error saat menjalankan kode')
      toast.error('Error saat menjalankan kode')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectProblem = async (problem: Problem) => {
    setSelectedProblem(problem)
    setCode('')
    setFeedback([])
    setLatestResult(null)
    await fetchSubmissions(problem.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass rounded-2xl p-8 flex items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-white text-lg">Memuat dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-white/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                🎯 Mode Kerja
              </h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <button
                onClick={() => setMode('run')}
                className={`w-full rounded-xl px-4 py-4 text-left font-medium transition-all duration-300 ${
                  mode === 'run'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg pulse-glow'
                    : 'glass text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">▶️</span>
                  <div>
                    <div className="font-semibold">Run Code</div>
                    <div className="text-xs opacity-75 font-normal">Jalankan kode bebas tanpa batasan</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMode('submit')}
                className={`w-full rounded-xl px-4 py-4 text-left font-medium transition-all duration-300 ${
                  mode === 'submit'
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg pulse-glow'
                    : 'glass text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📤</span>
                  <div>
                    <div className="font-semibold">Submit Problem</div>
                    <div className="text-xs opacity-75 font-normal">Evaluasi dengan test case</div>
                  </div>
                </div>
              </button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="border-b border-white/10">
              <h3 className="font-semibold text-white flex items-center gap-2">
                💻 Bahasa Pemrograman
              </h3>
            </CardHeader>
            <CardBody>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'python' | 'javascript')}
                className="w-full rounded-xl glass border border-white/20 bg-transparent px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="python" className="bg-gray-800">🐍 Python</option>
                <option value="javascript" className="bg-gray-800">⚙️ JavaScript</option>
              </select>
            </CardBody>
          </Card>

          {mode === 'submit' && (
            <Card>
              <CardHeader className="border-b border-white/10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  📋 Soal Terpilih
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <p className="font-semibold text-white text-lg">{selectedProblem?.title || 'Tidak ada soal dipilih'}</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-slate-700 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {selectedProblem?.description || 'Deskripsi tidak tersedia'}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      💻 {selectedProblem?.language || '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      🧪 {selectedProblem?.test_cases?.length || 0} test case
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {mode === 'run' ? (
            <>
              {/* Run Code Layout Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setOutputLayout('side')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    outputLayout === 'side'
                      ? 'bg-blue-600 text-white'
                      : 'glass text-gray-300 hover:bg-white/10'
                  }`}
                  title="Output di samping editor"
                >
                  ↔️ Output Samping
                </button>
                <button
                  onClick={() => setOutputLayout('bottom')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    outputLayout === 'bottom'
                      ? 'bg-blue-600 text-white'
                      : 'glass text-gray-300 hover:bg-white/10'
                  }`}
                  title="Output di bawah editor"
                >
                  ↕️ Output Bawah
                </button>
              </div>

              {/* Editor + Output Container */}
              {outputLayout === 'side' ? (
                // Side by side layout
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Editor Card */}
                  <Card>
                    <CardHeader className="border-b border-white/10 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">💻</span> Editor
                      </h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        language === 'python'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                          : 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                      }`}>
                        {language === 'python' ? '🐍 Python' : '⚙️ JavaScript'}
                      </span>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-3">
                        <CodeEditor
                          value={code}
                          onChange={(val) => setCode(val ?? '')}
                          language={language}
                          height="500px"
                        />
                        <Button onClick={handleRunCode} loading={submitting} size="lg" className="w-full">
                          ▶ Run Code
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Output + Input Card */}
                  <div className="space-y-4 flex flex-col">
                    <Card>
                      <CardHeader className="border-b border-white/10">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <span className="text-xl">📥</span> Input (stdin)
                        </h3>
                      </CardHeader>
                      <CardBody>
                        <textarea
                          value={stdinInput}
                          onChange={(e) => setStdinInput(e.target.value)}
                          placeholder="Masukkan input jika diperlukan..."
                          className="w-full rounded-lg glass border border-white/20 bg-transparent p-3 text-white font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={6}
                        />
                      </CardBody>
                    </Card>

                    <Card className="flex-1 flex flex-col">
                      <CardHeader className="border-b border-white/10">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <span className="text-xl">▶️</span> Hasil Output
                        </h3>
                      </CardHeader>
                      <CardBody className="space-y-3 flex-1 flex flex-col">
                        {runOutput && (
                          <div className="rounded-lg glass border border-green-500/30 bg-green-500/10 p-3 flex-1 overflow-auto">
                            <div className="text-xs font-semibold text-green-400 uppercase mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              Output
                            </div>
                            <pre className="text-sm text-gray-200 font-mono whitespace-pre-wrap break-words max-h-64 overflow-auto">
                              {runOutput}
                            </pre>
                          </div>
                        )}

                        {runError && (
                          <div className="rounded-lg glass border border-red-500/30 bg-red-500/10 p-3 flex-1 overflow-auto">
                            <div className="text-xs font-semibold text-red-400 uppercase mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              Error
                            </div>
                            <pre className="text-sm text-red-200 font-mono whitespace-pre-wrap break-words max-h-64 overflow-auto">
                              {runError}
                            </pre>
                          </div>
                        )}

                        {!runOutput && !runError && (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                              <div className="text-3xl mb-2">📤</div>
                              <p className="text-sm">Klik "Run Code" untuk melihat output</p>
                            </div>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                </div>
              ) : (
                // Bottom layout
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="border-b border-white/10 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">💻</span> Editor Kode
                      </h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        language === 'python'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                          : 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                      }`}>
                        {language === 'python' ? '🐍 Python' : '⚙️ JavaScript'}
                      </span>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-4">
                        <CodeEditor
                          value={code}
                          onChange={(val) => setCode(val ?? '')}
                          language={language}
                          height="420px"
                        />

                        <div>
                          <label className="block text-sm font-medium mb-2">Input (stdin)</label>
                          <textarea
                            value={stdinInput}
                            onChange={(e) => setStdinInput(e.target.value)}
                            placeholder="Masukkan input jika diperlukan..."
                            className="w-full rounded-lg glass border border-white/20 bg-transparent p-4 text-white font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                        </div>

                        <Button onClick={handleRunCode} loading={submitting} size="lg" className="w-full">
                          ▶ Run Code
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Output Section Below */}
                  <Card>
                    <CardHeader className="border-b border-white/10">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <span className="text-xl">▶️</span> Hasil Eksekusi
                      </h3>
                    </CardHeader>
                    <CardBody className="space-y-3 min-h-48">
                      {runOutput && (
                        <div className="rounded-lg glass border border-green-500/30 bg-green-500/10 p-4">
                          <div className="text-xs font-semibold text-green-400 uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Output
                          </div>
                          <pre className="text-sm text-gray-200 font-mono whitespace-pre-wrap break-words max-h-64 overflow-auto">
                            {runOutput}
                          </pre>
                        </div>
                      )}

                      {runError && (
                        <div className="rounded-lg glass border border-red-500/30 bg-red-500/10 p-4">
                          <div className="text-xs font-semibold text-red-400 uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Error
                          </div>
                          <pre className="text-sm text-red-200 font-mono whitespace-pre-wrap break-words max-h-64 overflow-auto">
                            {runError}
                          </pre>
                        </div>
                      )}

                      {!runOutput && !runError && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📤</div>
                            <p className="text-sm">Klik "Run Code" untuk melihat output di sini</p>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              )}
            </>
          ) : (
            // Submit Mode
            <>
              {selectedProblem && (
                <Card>
                  <CardHeader className="border-b border-white/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="text-xl">📄</span> Deskripsi Soal: {selectedProblem.title}
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-6 text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed max-h-64 overflow-auto">
                      {selectedProblem.description || 'Deskripsi tidak tersedia'}
                    </div>
                  </CardBody>
                </Card>
              )}
              
              <Card>
                <CardHeader className="border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">💻</span> Editor Kode Canggih
                  </h2>
                  <span className={`text-xs px-4 py-2 rounded-full font-semibold ${
                    language === 'python'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                  }`}>
                    {language === 'python' ? '🐍 Python' : '⚙️ JavaScript'}
                  </span>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <CodeEditor
                      value={code}
                      onChange={(val) => setCode(val ?? '')}
                      language={language}
                      height="420px"
                    />

                    <div>
                      <label className="block text-sm font-medium mb-2">Input (stdin)</label>
                      <textarea
                        value={stdinInput}
                        onChange={(e) => setStdinInput(e.target.value)}
                        placeholder="Masukkan input jika diperlukan..."
                        className="w-full rounded-xl glass border border-white/20 bg-transparent p-4 text-white font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button onClick={handleSubmit} loading={submitting} size="lg">
                        📤 Submit Problem
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {latestResult && (
                <Card>
                  <CardHeader className="border-b border-white/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="text-xl">📊</span> Hasil Evaluasi
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl glass border border-blue-500/30 bg-blue-500/10 p-4">
                        <div className="text-xs text-blue-300 mb-1 uppercase font-semibold">Status</div>
                        <div
                          className={`text-xl font-bold flex items-center gap-2 ${
                            latestResult.status === 'passed' ? 'text-green-400' : 'text-orange-400'
                          }`}
                        >
                          {latestResult.status === 'passed' ? '✓ Passed' : '✗ Failed'}
                        </div>
                      </div>
                      <div className="rounded-xl glass border border-purple-500/30 bg-purple-500/10 p-4">
                        <div className="text-xs text-purple-300 mb-1 uppercase font-semibold">Lulus</div>
                        <div className="text-xl font-bold text-purple-300">
                          {latestResult.passed}/{latestResult.total}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {latestResult.details.map((detail, idx) => (
                        <div
                          key={detail.test_id}
                          className={`rounded-xl glass border-2 p-4 transition-all ${
                            detail.passed
                              ? 'border-green-500/30 bg-green-500/10'
                              : 'border-red-500/30 bg-red-500/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`font-bold text-sm flex items-center gap-2 ${
                                detail.passed ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full animate-pulse" style={{
                                backgroundColor: detail.passed ? '#4ade80' : '#f87171'
                              }}></span>
                              Test Case {idx + 1}: {detail.passed ? 'Passed ✓' : 'Failed ✗'}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-900/30 px-2 py-1 rounded">Input: {detail.input || '(empty)'}</span>
                          </div>
                          
                          <div className="space-y-2">
                            {/* Input Display */}
                            <div>
                              <div className="text-xs font-semibold text-blue-300 mb-1">📥 INPUT:</div>
                              <div className="bg-gray-900/50 border border-blue-500/20 rounded-lg p-2 font-mono text-xs text-blue-200 max-h-24 overflow-auto">
                                {detail.input || '(empty)'}
                              </div>
                            </div>

                            {/* Expected Output Display */}
                            <div>
                              <div className="text-xs font-semibold text-green-300 mb-1">✓ EXPECTED OUTPUT:</div>
                              <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-2 font-mono text-xs text-green-200 max-h-24 overflow-auto">
                                {detail.expected || '(empty)'}
                              </div>
                            </div>

                            {/* Actual Output Display */}
                            <div>
                              <div className={`text-xs font-semibold mb-1 ${detail.passed ? 'text-green-300' : 'text-red-300'}`}>
                                {detail.passed ? '✓ YOUR OUTPUT:' : '✗ YOUR OUTPUT:'}
                              </div>
                              <div className={`bg-gray-900/50 border rounded-lg p-2 font-mono text-xs max-h-24 overflow-auto ${
                                detail.passed 
                                  ? 'border-green-500/20 text-green-200' 
                                  : 'border-red-500/20 text-red-200'
                              }`}>
                                {detail.output || '(empty)'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {feedback.length > 0 && (
                <Card>
                  <CardHeader className="border-b border-white/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="text-xl">💡</span> Feedback AI Cerdas
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    {feedback.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl glass border border-amber-500/30 bg-amber-500/10 p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-amber-300 capitalize flex items-center gap-2">
                            <span className="text-lg">⚡</span>
                            {item.category}
                          </span>
                          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full font-medium">Saran</span>
                        </div>
                        <pre className="text-sm text-amber-100 leading-relaxed font-sans whitespace-pre-wrap break-words">{item.message}</pre>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {mode === 'submit' && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader className="border-b border-white/10">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">📋</span> Daftar Soal
              </h3>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {problems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => handleSelectProblem(problem)}
                  className={`text-left rounded-xl border-2 p-4 transition-all duration-300 ${
                    selectedProblem?.id === problem.id
                      ? 'glass border-blue-500/50 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                      : 'glass border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="font-semibold text-white">{problem.title}</div>
                  <div className="text-xs text-gray-400 mt-2 flex gap-3">
                    <span className="flex items-center gap-1">
                      💻 {problem.language}
                    </span>
                    <span className="flex items-center gap-1">
                      🧪 {problem.test_cases?.length || 0}
                    </span>
                  </div>
                </button>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="border-b border-white/10">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">⏱️</span> Riwayat Submission
              </h3>
            </CardHeader>
            <CardBody>
              <SubmissionHistory 
                submissions={submissions}
                onSubmissionsChange={() => selectedProblem && fetchSubmissions(selectedProblem.id)}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
