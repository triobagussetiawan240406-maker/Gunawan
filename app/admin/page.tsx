'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/Button'
import { Card, CardBody, CardHeader, CardFooter } from '@/components/Card'
import toast from 'react-hot-toast'
import type { Problem, TestCase } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState<'python' | 'javascript'>('python')
  const [caseInput, setCaseInput] = useState('')
  const [caseExpected, setCaseExpected] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingProblemId, setDeletingProblemId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchProblems = async () => {
    const { data, error } = await supabase
      .from('problems')
      .select('id, title, description, language, test_cases (id, input, expected_output)')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Gagal memuat soal admin')
      console.error(error)
      return
    }

    setProblems(data || [])
    setSelectedProblem((prev) => {
      if (prev) {
        return data?.find((problem) => problem.id === prev.id) || data?.[0] || null
      }
      return data?.[0] || null
    })
  }

  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
        return
      }

      // Check admin role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (error || profile?.role !== 'admin') {
        toast.error('Akses ditolak. Halaman ini hanya untuk admin.')
        router.push('/login')
        return
      }

      setUser(data.user)
      await fetchProblems()
      setLoading(false)
    }

    void initialize()
  }, [router])

  const handleCreateProblem = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Judul dan deskripsi harus diisi')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('problems').insert({
      title: title.trim(),
      description: description.trim(),
      language
    })

    if (error) {
      toast.error(error.message)
      console.error(error)
    } else {
      toast.success('Soal berhasil dibuat')
      setTitle('')
      setDescription('')
      await fetchProblems()
    }

    setSaving(false)
  }

  const handleAddTestCase = async () => {
    if (!selectedProblem) {
      toast.error('Pilih soal terlebih dahulu')
      return
    }

    if (!caseInput.trim() || !caseExpected.trim()) {
      toast.error('Input dan expected output harus diisi')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('test_cases').insert({
      problem_id: selectedProblem.id,
      input: caseInput.trim(),
      expected_output: caseExpected.trim()
    })

    if (error) {
      toast.error(error.message)
      console.error(error)
    } else {
      toast.success('Test case berhasil ditambahkan')
      setCaseInput('')
      setCaseExpected('')
      await fetchProblems()
    }

    setSaving(false)
  }

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!selectedProblem) return

    const { error } = await supabase.from('test_cases').delete().eq('id', testCaseId)
    if (error) {
      toast.error(error.message)
      console.error(error)
      return
    }

    toast.success('Test case dihapus')
    await fetchProblems()
  }

  const handleDeleteProblem = async (problemId: string) => {
    try {
      setDeletingProblemId(problemId)
      const { error } = await supabase.from('problems').delete().eq('id', problemId)

      if (error) {
        toast.error(error.message)
        console.error(error)
        setDeletingProblemId(null)
        return
      }

      toast.success('Soal berhasil dihapus')
      setConfirmDelete(null)
      if (selectedProblem?.id === problemId) {
        setSelectedProblem(null)
      }
      await fetchProblems()
    } catch (error) {
      console.error('Error deleting problem:', error)
      toast.error('Gagal menghapus soal')
    } finally {
      setDeletingProblemId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📋 Admin Panel
            </h1>
            <p className="text-sm text-slate-600 mt-1">Kelola soal dan test case coding</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.email}</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-slate-600 font-medium">Total Soal</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{problems.length}</div>
            <div className="text-xs text-slate-500 mt-2">📚 Soal aktif</div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-slate-600 font-medium">Test Cases</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {selectedProblem?.test_cases?.length || 0}
            </div>
            <div className="text-xs text-slate-500 mt-2">✅ Untuk soal terpilih</div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm text-slate-600 font-medium">Bahasa</div>
            <div className="text-2xl font-bold text-amber-600 mt-2 capitalize">
              {selectedProblem?.language || '—'}
            </div>
            <div className="text-xs text-slate-500 mt-2">💻 Bahasa terpilih</div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-6">
            {/* Create Problem Card */}
            <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                <h3 className="font-bold text-lg">✨ Buat Soal Baru</h3>
                <p className="text-blue-100 text-sm mt-1">Tambahkan soal coding baru</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">📝 Judul Soal</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                    placeholder="Contoh: Hitung Faktorial"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">📖 Deskripsi</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[120px] rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none transition-all bg-white"
                    placeholder="Tuliskan instruksi soal dan contoh input/output"
                  />
                </div>
                <div>
                  <label htmlFor="language" className="block text-sm font-semibold text-slate-700 mb-2">💻 Bahasa</label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'python' | 'javascript')}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
                  >
                    <option value="python">🐍 Python</option>
                    <option value="javascript">🟨 JavaScript</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateProblem}
                  disabled={saving}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  {saving ? '⏳ Menyimpan...' : '✅ Simpan Soal'}
                </button>
              </div>
            </div>

            {/* Problem List Card */}
            <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
                <h3 className="font-bold text-lg">📚 Daftar Soal</h3>
                <p className="text-purple-100 text-sm mt-1">{problems.length} soal tersedia</p>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {problems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 text-sm">📭 Belum ada soal</p>
                    <p className="text-slate-400 text-xs mt-1">Buat soal baru di atas</p>
                  </div>
                ) : (
                  problems.map((problem) => (
                    <div key={problem.id} className="space-y-2">
                      {confirmDelete === problem.id ? (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 space-y-2 animate-pulse">
                          <p className="text-xs font-bold text-red-800">🗑️ Hapus "{problem.title}"?</p>
                          <p className="text-xs text-red-600">Tidak dapat dibatalkan!</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => void handleDeleteProblem(problem.id)}
                              disabled={deletingProblemId === problem.id}
                              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1.5 text-xs font-semibold transition-all"
                            >
                              {deletingProblemId === problem.id ? '⏳' : '✓'} Hapus
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="flex-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-1.5 text-xs font-semibold transition-all"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedProblem(problem)}
                          className={`w-full text-left rounded-xl px-4 py-3 transition-all flex items-center justify-between group ${
                            selectedProblem?.id === problem.id
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                              : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{problem.title}</div>
                            <div className={`text-xs ${selectedProblem?.id === problem.id ? 'opacity-80' : 'opacity-60'}`}>
                              {problem.language} • {problem.test_cases?.length || 0} case
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmDelete(problem.id)
                            }}
                            className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                              selectedProblem?.id === problem.id ? 'text-white' : 'text-red-500'
                            }`}
                          >
                            🗑️
                          </button>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {selectedProblem ? (
              <>
                {/* Problem Details Card */}
                <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold">{selectedProblem.title}</h2>
                        <div className="flex flex-wrap gap-3 mt-4">
                          <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold">
                            {selectedProblem.language === 'python' ? '🐍' : '🟨'} {selectedProblem.language}
                          </span>
                          <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold">
                            ✅ {selectedProblem.test_cases?.length || 0} Test Cases
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(selectedProblem.id)}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="font-semibold text-slate-700 mb-3">📋 Deskripsi Soal</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-slate-700 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {selectedProblem.description}
                    </div>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {confirmDelete === selectedProblem.id && (
                  <div className="rounded-3xl bg-red-50 border-2 border-red-300 p-8 shadow-lg animate-pulse">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-red-800">⚠️ Konfirmasi Penghapusan</h3>
                        <p className="text-red-700 mt-3 text-sm">
                          Anda akan menghapus soal: <span className="font-bold">"{selectedProblem.title}"</span>
                        </p>
                        <p className="text-red-600 mt-2 text-xs">
                          ⚡ Tindakan ini tidak dapat dibatalkan. Semua test case dan submission untuk soal ini juga akan dihapus.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => void handleDeleteProblem(selectedProblem.id)}
                          disabled={deletingProblemId === selectedProblem.id}
                          className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 font-bold transition-all shadow-md"
                        >
                          {deletingProblemId === selectedProblem.id ? '⏳ Menghapus...' : '🗑️ Hapus Soal'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 rounded-xl bg-white border-2 border-red-200 hover:bg-red-50 text-red-700 px-4 py-3 font-bold transition-all"
                        >
                          ✖️ Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Test Case Card */}
                <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
                    <h3 className="font-bold text-lg">➕ Tambah Test Case</h3>
                    <p className="text-amber-100 text-sm mt-1">Masukkan input dan expected output</p>
                  </div>
                  <div className="p-8">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="caseInput" className="block text-sm font-semibold text-slate-700 mb-2">📥 Input</label>
                        <input
                          id="caseInput"
                          type="text"
                          value={caseInput}
                          onChange={(e) => setCaseInput(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all font-mono bg-white"
                          placeholder="Contoh: 5"
                        />
                        <p className="text-xs text-slate-500 mt-2">Masukkan nilai input test</p>
                      </div>
                      <div>
                        <label htmlFor="caseExpected" className="block text-sm font-semibold text-slate-700 mb-2">📤 Expected Output</label>
                        <input
                          id="caseExpected"
                          type="text"
                          value={caseExpected}
                          onChange={(e) => setCaseExpected(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all font-mono bg-white"
                          placeholder="Contoh: 120"
                        />
                        <p className="text-xs text-slate-500 mt-2">Output yang diharapkan</p>
                      </div>
                    </div>
                    <button
                      onClick={handleAddTestCase}
                      disabled={saving}
                      className="w-full mt-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition-all shadow-md hover:shadow-lg cursor-pointer"
                    >
                      {saving ? '⏳ Menambahkan...' : '✅ Tambah Test Case'}
                    </button>
                  </div>
                </div>

                {/* Test Case List Card */}
                <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                    <h3 className="font-bold text-lg">✅ List Test Case</h3>
                    <p className="text-green-100 text-sm mt-1">Total: {selectedProblem.test_cases?.length || 0} test case</p>
                  </div>
                  <div className="p-6">
                    {selectedProblem.test_cases?.length ? (
                      <div className="space-y-3">
                        {selectedProblem.test_cases.map((testCase, index) => (
                          <div
                            key={testCase.id}
                            className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:border-green-300 hover:shadow-md transition-all group"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">Test Case</span>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 mb-1">📥 Input:</p>
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 font-mono text-sm text-blue-900 break-all">
                                    {testCase.input}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 mb-1">📤 Expected Output:</p>
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 font-mono text-sm text-purple-900 break-all">
                                    {testCase.expected_output}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => void handleDeleteTestCase(testCase.id)}
                              className="sm:mt-0 mt-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 px-4 py-2 font-semibold transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                            >
                              🗑️ Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-slate-500 text-sm font-medium">📭 Belum ada test case</p>
                        <p className="text-slate-400 text-xs mt-2">Tambahkan test case di atas</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Pilih Soal untuk Melanjutkan</h3>
                <p className="text-slate-600 mb-6">Pilih salah satu soal dari daftar di samping untuk melihat detail dan menambahkan test case.</p>
                <div className="inline-block bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-semibold">
                  {problems.length === 0 ? '📝 Mulai dengan membuat soal baru' : '📚 Pilih soal dari list'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


