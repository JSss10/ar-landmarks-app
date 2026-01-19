'use client'

import { useState, useEffect, FormEvent } from 'react'
import Modal from './Modal'
import { Landmark, Category } from '@/lib/supabase/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

interface LandmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  landmark?: Landmark | null
  categories: Category[]
}

export default function LandmarkModal({ isOpen, onClose, onSuccess, landmark, categories }: LandmarkModalProps) {
  const isEditMode = !!landmark
  const supabase = getSupabaseBrowserClient()

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    latitude: '',
    longitude: '',
    altitude: '',
    category_id: '',
    image_url: '',
    zurich_tourism_id: '',
    is_active: true,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (landmark) {
      setFormData({
        name: landmark.name || '',
        name_en: landmark.name_en || '',
        description: landmark.description || '',
        description_en: landmark.description_en || '',
        latitude: landmark.latitude?.toString() || '',
        longitude: landmark.longitude?.toString() || '',
        altitude: landmark.altitude?.toString() || '',
        category_id: landmark.category_id || '',
        image_url: landmark.image_url || '',
        zurich_tourism_id: landmark.zurich_tourism_id || '',
        is_active: landmark.is_active ?? true,
      })
    } else {
      setFormData({
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        latitude: '',
        longitude: '',
        altitude: '',
        category_id: categories[0]?.id || '',
        image_url: '',
        zurich_tourism_id: '',
        is_active: true,
      })
    }
    setError('')
  }, [landmark, categories, isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.name || !formData.latitude || !formData.longitude || !formData.altitude) {
        throw new Error('Please fill in all required fields')
      }

      const landmarkData = {
        name: formData.name,
        name_en: formData.name_en || null,
        description: formData.description || null,
        description_en: formData.description_en || null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        altitude: parseFloat(formData.altitude),
        category_id: formData.category_id || null,
        image_url: formData.image_url || null,
        zurich_tourism_id: formData.zurich_tourism_id || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      }

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('landmarks')
          // @ts-ignore - Supabase client has no schema types
          .update(landmarkData)
          .eq('id', landmark.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('landmarks')
          // @ts-ignore - Supabase client has no schema types
          .insert([{ ...landmarkData, created_at: new Date().toISOString() }])

        if (insertError) throw insertError
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Landmark' : 'Create New Landmark'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name (Localized) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
              placeholder="Grossmünster"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name (English)
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
              placeholder="Grossmünster"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Latitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
              placeholder="47.3704"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Longitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
              placeholder="8.5441"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Altitude (m) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={formData.altitude}
              onChange={(e) => setFormData({ ...formData, altitude: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
              placeholder="408"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description (Localized)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white resize-none"
            placeholder="Eine romanische Kirche in Zürich..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description (English)
          </label>
          <textarea
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white resize-none"
            placeholder="A Romanesque-style Protestant church in Zurich..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Zurich Tourism ID
            </label>
            <input
              type="text"
              value={formData.zurich_tourism_id}
              onChange={(e) => setFormData({ ...formData, zurich_tourism_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
              placeholder="ID"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Active
          </label>
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
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Landmark' : 'Create Landmark'}
          </button>
        </div>
      </form>
    </Modal>
  )
}