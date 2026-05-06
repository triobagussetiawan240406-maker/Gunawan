'use client'
import { Submission } from '@/lib/types'
import { Card, CardBody } from './Card'
import { Trash2, Clock } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface SubmissionHistoryProps {
  submissions?: Submission[]
  loading?: boolean
  onSubmissionsChange?: () => void
}

export function SubmissionHistory({ submissions = [], loading = false, onSubmissionsChange }: SubmissionHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  const handleDelete = async (submissionId: string) => {
    try {
      setDeletingId(submissionId)
      const session = await supabase.auth.getSession()
      const accessToken = session.data?.session?.access_token

      if (!accessToken) {
        toast.error('Session expired. Please login again.')
        setDeletingId(null)
        return
      }

      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('API error:', response.status, response.statusText)
        toast.error(`Error: ${response.statusText}`)
        setDeletingId(null)
        return
      }

      const result = await response.json()
      if (result.success) {
        toast.success('Submission berhasil dihapus')
        setShowConfirm(null)
        setDeletedIds(prev => new Set(prev).add(submissionId))
        onSubmissionsChange?.()
      } else {
        toast.error(result.error || 'Gagal menghapus submission')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Error saat menghapus submission')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
      </div>
    )
  }

  // Filter out deleted submissions
  const visibleSubmissions = submissions.filter(s => !deletedIds.has(s.id))

  if (visibleSubmissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">📝</div>
        <p className="text-gray-400">Belum ada submission</p>
        <p className="text-gray-500 text-sm mt-1">Mulai dengan submit soal pertama Anda</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleSubmissions.map((submission) => (
        <div key={submission.id} className="group">
          {showConfirm === submission.id ? (
            <div className="glass rounded-2xl p-4 border border-red-500/50 bg-red-500/10">
              <div className="space-y-3">
                <p className="text-white font-medium">Hapus submission ini?</p>
                <p className="text-sm text-gray-300">Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(submission.id)}
                    disabled={deletingId === submission.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    {deletingId === submission.id ? '⏳ Menghapus...' : '🗑️ Hapus'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 glass border border-white/20 hover:bg-white/10 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Card className="glass hover:scale-102 transition-all duration-300 hover:border-white/30">
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      {submission.result.status === 'passed' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-sm font-semibold text-green-400">
                            ✓ {submission.result.passed}/{submission.result.total} Passed
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <span className="text-sm font-semibold text-red-400">
                            ✗ {submission.result.passed}/{submission.result.total} Failed

                          </span>
                        </div>
                      )}
                    </div>

                    {submission.created_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                        <Clock className="w-3 h-3" />
                        {formatDate(submission.created_at)}
                      </div>
                    )}

                    <div className="text-xs text-gray-300 bg-gray-900/40 rounded-lg p-2 font-mono line-clamp-2 border border-white/5">
                      {submission.code.substring(0, 80)}
                      {submission.code.length > 80 ? '...' : ''}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowConfirm(submission.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Hapus submission"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      ))}
    </div>
  )
}
