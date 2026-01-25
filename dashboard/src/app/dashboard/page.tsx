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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage landmarks for the AR prototype
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Zurich POIs</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Landmark</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {landmarks.length}
            </div>
            <div className="text-gray-600">Landmarks</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {landmarks.filter(l => l.is_active).length}
            </div>
            <div className="text-gray-600">Active entries</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Landmarks</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {landmarks.map((landmark) => (
                  <tr key={landmark.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {landmark.name_en || landmark.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {landmark.latitude.toFixed(4)}, {landmark.longitude.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateEnglish(landmark.date_modified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${landmark.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {landmark.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(landmark)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit landmark"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(landmark)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete landmark"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleSuccess}
        />

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