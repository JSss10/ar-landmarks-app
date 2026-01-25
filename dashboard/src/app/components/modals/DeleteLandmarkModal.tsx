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
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
          <div className="shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-red-800">
              Are you sure you want to delete this landmark? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Landmark</p>
          <p className="text-sm font-medium text-gray-900">{landmark.name_en || landmark.name}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}