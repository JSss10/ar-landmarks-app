'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { Landmark } from '@/lib/supabase/types'
import { User } from '@supabase/supabase-js'
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

function getUserInitials(user: User | null): string {
  if (!user) return '?'

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name
  if (fullName) {
    const parts = fullName.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return fullName[0].toUpperCase()
  }

  if (user.email) {
    return user.email[0].toUpperCase()
  }

  return '?'
}

function getUserAvatarUrl(user: User | null): string | null {
  if (!user) return null
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || null
}

export default function Home() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'name' | 'date_modified' | 'status'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filteredAndSortedLandmarks = useMemo(() => {
    let result = [...landmarks]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(landmark =>
        (landmark.name_en || landmark.name || '').toLowerCase().includes(query) ||
        (landmark.name || '').toLowerCase().includes(query)
      )
    }

    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          const nameA = (a.name_en || a.name || '').toLowerCase()
          const nameB = (b.name_en || b.name || '').toLowerCase()
          comparison = nameA.localeCompare(nameB)
          break
        case 'date_modified':
          const dateA = a.date_modified ? new Date(a.date_modified).getTime() : 0
          const dateB = b.date_modified ? new Date(b.date_modified).getTime() : 0
          comparison = dateA - dateB
          break
        case 'status':
          comparison = (a.is_active === b.is_active) ? 0 : a.is_active ? -1 : 1
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [landmarks, searchQuery, sortField, sortDirection])

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

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/')
  }

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
      const response = await fetch('/api/sync-pois', {
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
                Manage AR landmarks
              </p>
            </div>
            <div className="flex items-center gap-3">
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

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-b from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border shadow-sm transition-all active:scale-95 overflow-hidden"
                  title={user?.email || 'Profile'}
                >
                  {getUserAvatarUrl(user) ? (
                    <img
                      src={getUserAvatarUrl(user)!}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-600">
                      {getUserInitials(user)}
                    </span>
                  )}
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200/60 shadow-lg shadow-black/10 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Signed in
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/60">
            <div className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {landmarks.length}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">Total landmarks</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 sm:p-5 border border-green-200/60">
            <div className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {landmarks.filter(l => l.is_active).length}
            </div>
            <div className="text-sm text-green-700 mt-0.5">Active</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">All Landmarks</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search landmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-9 pr-8 py-2 text-sm text-gray-500 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                    >
                      <span>
                        {sortField === 'name' && 'Sort by Name'}
                        {sortField === 'date_modified' && 'Sort by Modified'}
                        {sortField === 'status' && 'Sort by Status'}
                      </span>
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {isSortDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg shadow-black/10 overflow-hidden z-50">
                        <div className="py-1">
                          {[
                            { value: 'name', label: 'Sort by Name' },
                            { value: 'date_modified', label: 'Sort by Modified' },
                            { value: 'status', label: 'Sort by Status' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortField(option.value as 'name' | 'date_modified' | 'status')
                                setIsSortDropdownOpen(false)
                              }}
                              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 text-left transition-colors ${sortField === option.value
                                ? 'bg-gray-50'
                                : 'hover:bg-gray-50'
                                }`}
                            >
                              {sortField === option.value && (
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {sortField !== option.value && <span className="w-4" />}
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortDirection === 'asc' ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-[40%]">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell w-[20%]">
                    Coordinates
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell w-[15%]">
                    Modified
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-[12%]">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide w-[13%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedLandmarks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center">
                      <p className="text-sm text-gray-500">
                        {searchQuery ? `No landmarks found matching "${searchQuery}"` : 'No landmarks available'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedLandmarks.map((landmark) => (
                    <tr key={landmark.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5">
                        <span className="text-sm text-gray-500">
                          {landmark.name_en || landmark.name}
                        </span>
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
                  ))
                )}
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