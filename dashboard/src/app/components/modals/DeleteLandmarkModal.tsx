'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Modal from './Modal'
import { Landmark } from '@/lib/supabase/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

interface DeleteLandmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  landmark: Landmark | null
}

export default function DeleteLandmarkModal({ isOpen, onClose, onSuccess, landmark }: DeleteLandmarkModalProps) {
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!landmark) return

    setLoading(true)

    try {
      const { error: deleteError } = await supabase
        .from('landmarks')
        .delete()
        .eq('id', landmark.id)

      if (deleteError) throw deleteError

      toast.success('Landmark deleted successfully')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete landmark')
    } finally {
      setLoading(false)
    }
  }

  if (!landmark) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Landmark"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
          <div className="flex items-start space-x-3">
            <div className="shrink-0">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                Warning
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Are you sure you want to delete this landmark? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Name:</span>
            <span className="ml-2 text-sm text-slate-900 dark:text-white">{landmark.name_en || landmark.name}</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
          >
            {loading ? 'Deleting...' : 'Delete Landmark'}
          </button>
        </div>
      </div>
    </Modal>
  )
}