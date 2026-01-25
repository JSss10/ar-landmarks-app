'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { Landmark } from '@/lib/supabase/types'
import LandmarkModal from '@/app/components/modals/LandmarkModal'
import DeleteLandmarkModal from '@/app/components/modals/DeleteLandmarkModal'

function formatDateEnglish(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

export default function Home() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchData = async () => {
    const supabase = getSupabaseBrowserClient()

    try {
      setLoading(true)
      const { data: landmarksData, error: landmarksError } = await supabase
        .from('landmarks')
        .select('*')
        .order('name')

      if (landmarksError) throw landmarksError

      setLandmarks(landmarksData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEdit = (landmark: Landmark) => {
    setSelectedLandmark(landmark)
    setIsEditModalOpen(true)
  }

  const handleDelete = (landmark: Landmark) => {
    setSelectedLandmark(landmark)
    setIsDeleteModalOpen(true)
  }

  const handleSuccess = () => {
    fetchData()
  }

  const handleSync = async () => {
    setIsSyncing(true)

    try {
      const response = await fetch('/api/sync-zurich-pois', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId: 72 }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || 'Sync failed')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync POIs')
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-base text-red-600 font-medium">Error: {error}</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                Landmarks
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Manage AR landmarks for Zurich
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync POIs</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/60">
            <div className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {landmarks.length}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">Total landmarks</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/60">
            <div className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {landmarks.filter(l => l.is_active).length}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">Active</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">All Landmarks</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Coordinates
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Modified
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {landmarks.map((landmark) => (
                  <tr key={landmark.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="font-medium text-gray-900 text-sm">
                        {landmark.name_en || landmark.name}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 font-mono">
                        {landmark.latitude.toFixed(4)}, {landmark.longitude.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-gray-500">
                        {formatDateEnglish(landmark.date_modified)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${landmark.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {landmark.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(landmark)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(landmark)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <LandmarkModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleSuccess}
          landmark={selectedLandmark}
        />

        <DeleteLandmarkModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={handleSuccess}
          landmark={selectedLandmark}
        />
      </div>
    </main>
  )
}