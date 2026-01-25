'use client'

import { useState, useEffect, FormEvent } from 'react'
import { toast } from 'sonner'
import Modal from './Modal'
import { Landmark } from '@/lib/supabase/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

interface LandmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  landmark?: Landmark | null
}

function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

function parseOpeningHours(hours: string | null | undefined): string {
  if (!hours) return ''

  if (hours.includes('\n')) return hours

  const dayMap: Record<string, string> = {
    'Mo': 'Monday',
    'Tu': 'Tuesday',
    'We': 'Wednesday',
    'Th': 'Thursday',
    'Fr': 'Friday',
    'Sa': 'Saturday',
    'Su': 'Sunday'
  }

  const parts = hours.split(' ')
  if (parts.length === 2) {
    const days = parts[0].split(',')
    const timeRange = parts[1].replace(/:00$/g, '').replace(/:00-/g, '-').replace(/(\d{2}:\d{2}):\d{2}/g, '$1')

    const formattedDays = days.map(d => {
      const fullDay = dayMap[d] || d
      return `${fullDay}: ${timeRange}`
    })

    return formattedDays.join('\n')
  }

  return hours
}

export default function LandmarkModal({ isOpen, onClose, onSuccess, landmark }: LandmarkModalProps) {
  const isEditMode = !!landmark
  const supabase = getSupabaseBrowserClient()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    title_teaser: '',
    text_teaser: '',
    detailed_information: '',
    zurich_card_description: '',
    zurich_card: false,
    latitude: '',
    longitude: '',
    api_categories: '',
    image_url: '',
    image_caption: '',
    price: '',
    zurich_tourism_id: '',
    is_active: true,
    date_modified: '',
    opens: '',
    opening_hours: '',
    special_opening_hours: '',
    address_country: '',
    street_address: '',
    postal_code: '',
    city: '',
    phone: '',
    email: '',
    website_url: '',
    place: '',
    photo_0_url: '',
    photo_0_caption: '',
    photo_1_url: '',
    photo_1_caption: '',
    photo_2_url: '',
    photo_2_caption: '',
  })

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'location' | 'hours' | 'photos'>('basic')

  useEffect(() => {
    if (landmark) {
      setFormData({
        name: landmark.name_en || landmark.name || '',
        description: landmark.description_en || landmark.description || '',
        title_teaser: landmark.title_teaser || '',
        text_teaser: landmark.text_teaser || '',
        detailed_information: Array.isArray(landmark.detailed_information)
          ? landmark.detailed_information.join('\n')
          : '',
        zurich_card_description: landmark.zurich_card_description || '',
        zurich_card: landmark.zurich_card ?? false,
        latitude: landmark.latitude?.toString() || '',
        longitude: landmark.longitude?.toString() || '',
        api_categories: Array.isArray(landmark.api_categories)
          ? landmark.api_categories.join(', ')
          : '',
        image_url: landmark.image_url || '',
        image_caption: landmark.image_caption || '',
        price: landmark.price || '',
        zurich_tourism_id: landmark.zurich_tourism_id || '',
        is_active: landmark.is_active ?? true,
        date_modified: landmark.date_modified || '',
        opens: landmark.opens || '',
        opening_hours: landmark.opening_hours || '',
        special_opening_hours: landmark.special_opening_hours || '',
        address_country: landmark.address_country || '',
        street_address: landmark.street_address || '',
        postal_code: landmark.postal_code || '',
        city: landmark.city || '',
        phone: landmark.phone || '',
        email: landmark.email || '',
        website_url: landmark.website_url || '',
        place: landmark.place || '',
        photo_0_url: landmark.photo_0_url || '',
        photo_0_caption: landmark.photo_0_caption || '',
        photo_1_url: landmark.photo_1_url || '',
        photo_1_caption: landmark.photo_1_caption || '',
        photo_2_url: landmark.photo_2_url || '',
        photo_2_caption: landmark.photo_2_caption || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        title_teaser: '',
        text_teaser: '',
        detailed_information: '',
        zurich_card_description: '',
        zurich_card: false,
        latitude: '',
        longitude: '',
        api_categories: '',
        image_url: '',
        image_caption: '',
        price: '',
        zurich_tourism_id: '',
        is_active: true,
        date_modified: '',
        opens: '',
        opening_hours: '',
        special_opening_hours: '',
        address_country: '',
        street_address: '',
        postal_code: '',
        city: '',
        phone: '',
        email: '',
        website_url: '',
        place: '',
        photo_0_url: '',
        photo_0_caption: '',
        photo_1_url: '',
        photo_1_caption: '',
        photo_2_url: '',
        photo_2_caption: '',
      })
    }
    setActiveTab('basic')
  }, [landmark, isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name || !formData.latitude || !formData.longitude) {
        throw new Error('Please fill in all required fields')
      }

      const detailedInfoArray = formData.detailed_information
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const apiCategoriesArray = formData.api_categories
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const landmarkData = {
        name: formData.name,
        name_en: formData.name,
        description: formData.description || null,
        description_en: formData.description || null,
        title_teaser: formData.title_teaser || null,
        text_teaser: formData.text_teaser || null,
        detailed_information: detailedInfoArray.length > 0 ? detailedInfoArray : null,
        zurich_card_description: formData.zurich_card_description || null,
        zurich_card: formData.zurich_card,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        api_categories: apiCategoriesArray.length > 0 ? apiCategoriesArray : null,
        image_url: formData.image_url || null,
        image_caption: formData.image_caption || null,
        price: formData.price || null,
        zurich_tourism_id: formData.zurich_tourism_id || null,
        is_active: formData.is_active,
        date_modified: formData.date_modified || null,
        opens: formData.opens || null,
        opening_hours: formData.opening_hours || null,
        special_opening_hours: formData.special_opening_hours || null,
        address_country: formData.address_country || null,
        street_address: formData.street_address || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website_url: formData.website_url || null,
        place: formData.place || null,
        photo_0_url: formData.photo_0_url || null,
        photo_0_caption: formData.photo_0_caption || null,
        photo_1_url: formData.photo_1_url || null,
        photo_1_caption: formData.photo_1_caption || null,
        photo_2_url: formData.photo_2_url || null,
        photo_2_caption: formData.photo_2_caption || null,
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

      toast.success(isEditMode ? 'Landmark updated successfully' : 'Landmark created successfully')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-slate-900 dark:text-white"
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
  const tabClass = (tab: string) => `px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Landmark' : 'Create New Landmark'}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <button type="button" className={tabClass('basic')} onClick={() => setActiveTab('basic')}>Basic Info</button>
          <button type="button" className={tabClass('content')} onClick={() => setActiveTab('content')}>Content</button>
          <button type="button" className={tabClass('location')} onClick={() => setActiveTab('location')}>Location</button>
          <button type="button" className={tabClass('hours')} onClick={() => setActiveTab('hours')}>Hours & Price</button>
          <button type="button" className={tabClass('photos')} onClick={() => setActiveTab('photos')}>Photos</button>
        </div>

        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="Landmark name"
                />
              </div>

              <div>
                <label className={labelClass}>API Categories</label>
                <input
                  type="text"
                  value={formData.api_categories}
                  onChange={(e) => setFormData({ ...formData, api_categories: e.target.value })}
                  className={inputClass}
                  placeholder="Culture, Museums, Art (comma-separated)"
                />
              </div>

              <div>
                <label className={labelClass}>Zurich Tourism ID</label>
                <input
                  type="text"
                  value={formData.zurich_tourism_id}
                  onChange={(e) => setFormData({ ...formData, zurich_tourism_id: e.target.value })}
                  className={inputClass}
                  placeholder="ID"
                />
              </div>

              <div>
                <label className={labelClass}>Place</label>
                <input
                  type="text"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Outdoors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
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

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="zurich_card"
                  checked={formData.zurich_card}
                  onChange={(e) => setFormData({ ...formData, zurich_card: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <label htmlFor="zurich_card" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Zurich Card
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>Date Modified</label>
              <input
                type="text"
                value={formData.date_modified}
                onChange={(e) => setFormData({ ...formData, date_modified: e.target.value })}
                className={inputClass}
                placeholder="2025-11-05T16:13"
              />
              {formData.date_modified && (
                <p className="text-xs text-slate-500 mt-1">
                  Displayed as: {formatDateForDisplay(formData.date_modified)}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={inputClass + " resize-none"}
                placeholder="Full description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Title Teaser</label>
                <input
                  type="text"
                  value={formData.title_teaser}
                  onChange={(e) => setFormData({ ...formData, title_teaser: e.target.value })}
                  className={inputClass}
                  placeholder="Teaser title"
                />
              </div>

              <div>
                <label className={labelClass}>Text Teaser</label>
                <input
                  type="text"
                  value={formData.text_teaser}
                  onChange={(e) => setFormData({ ...formData, text_teaser: e.target.value })}
                  className={inputClass}
                  placeholder="Teaser text"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Detailed Information (Highlights)</label>
              <textarea
                value={formData.detailed_information}
                onChange={(e) => setFormData({ ...formData, detailed_information: e.target.value })}
                rows={4}
                className={inputClass + " resize-none"}
                placeholder="One highlight per line"
              />
              <p className="text-xs text-slate-500 mt-1">Enter each highlight on a new line</p>
            </div>

            <div>
              <label className={labelClass}>Zurich Card Description</label>
              <textarea
                value={formData.zurich_card_description}
                onChange={(e) => setFormData({ ...formData, zurich_card_description: e.target.value })}
                rows={2}
                className={inputClass + " resize-none"}
                placeholder="Zurich Card benefits description"
              />
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Latitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className={inputClass}
                  placeholder="47.3704"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Longitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className={inputClass}
                  placeholder="8.5441"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Street Address</label>
                <input
                  type="text"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  className={inputClass}
                  placeholder="Hardturmstrasse 8"
                />
              </div>

              <div>
                <label className={labelClass}>Postal Code</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className={inputClass}
                  placeholder="8005"
                />
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={inputClass}
                  placeholder="Zurich"
                />
              </div>

              <div>
                <label className={labelClass}>Country</label>
                <input
                  type="text"
                  value={formData.address_country}
                  onChange={(e) => setFormData({ ...formData, address_country: e.target.value })}
                  className={inputClass}
                  placeholder="CH"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+41 44 123 45 67"
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  placeholder="info@example.com"
                />
              </div>

              <div>
                <label className={labelClass}>Website URL</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Opens</label>
              <input
                type="text"
                value={formData.opens}
                onChange={(e) => setFormData({ ...formData, opens: e.target.value })}
                className={inputClass}
                placeholder="e.g., 09:00"
              />
            </div>

            <div>
              <label className={labelClass}>Opening Hours</label>
              <textarea
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                rows={4}
                className={inputClass + " resize-none font-mono text-sm"}
                placeholder="Su,Mo,Tu,We,Th,Fr,Sa 08:00:00-16:50:00"
              />
              {formData.opening_hours && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Preview:</p>
                  <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {parseOpeningHours(formData.opening_hours)}
                  </pre>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Special Opening Hours</label>
              <textarea
                value={formData.special_opening_hours}
                onChange={(e) => setFormData({ ...formData, special_opening_hours: e.target.value })}
                rows={2}
                className={inputClass + " resize-none"}
                placeholder="e.g., Open around the clock"
              />
            </div>

            <div>
              <label className={labelClass}>Price</label>
              <textarea
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                rows={2}
                className={inputClass + " resize-none"}
                placeholder="e.g., CHF 15.- / Free entry"
              />
              <p className="text-xs text-slate-500 mt-1">Will be cleaned up for display (trimmed, null removed)</p>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Main Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className={inputClass}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className={labelClass}>Main Image Caption</label>
              <input
                type="text"
                value={formData.image_caption}
                onChange={(e) => setFormData({ ...formData, image_caption: e.target.value })}
                className={inputClass}
                placeholder="Image caption"
              />
            </div>

            {formData.image_url && (
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <img
                  src={formData.image_url}
                  alt="Main image preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}

            <hr className="border-slate-200 dark:border-slate-700" />

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Photo Gallery</h3>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo 1</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">URL</label>
                  <input
                    type="url"
                    value={formData.photo_0_url}
                    onChange={(e) => setFormData({ ...formData, photo_0_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Caption</label>
                  <input
                    type="text"
                    value={formData.photo_0_caption}
                    onChange={(e) => setFormData({ ...formData, photo_0_caption: e.target.value })}
                    className={inputClass}
                    placeholder="Caption"
                  />
                </div>
              </div>
              {formData.photo_0_url && (
                <img
                  src={formData.photo_0_url}
                  alt="Photo 1 preview"
                  className="h-24 w-auto rounded-lg object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo 2</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">URL</label>
                  <input
                    type="url"
                    value={formData.photo_1_url}
                    onChange={(e) => setFormData({ ...formData, photo_1_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Caption</label>
                  <input
                    type="text"
                    value={formData.photo_1_caption}
                    onChange={(e) => setFormData({ ...formData, photo_1_caption: e.target.value })}
                    className={inputClass}
                    placeholder="Caption"
                  />
                </div>
              </div>
              {formData.photo_1_url && (
                <img
                  src={formData.photo_1_url}
                  alt="Photo 2 preview"
                  className="h-24 w-auto rounded-lg object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo 3</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">URL</label>
                  <input
                    type="url"
                    value={formData.photo_2_url}
                    onChange={(e) => setFormData({ ...formData, photo_2_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Caption</label>
                  <input
                    type="text"
                    value={formData.photo_2_caption}
                    onChange={(e) => setFormData({ ...formData, photo_2_caption: e.target.value })}
                    className={inputClass}
                    placeholder="Caption"
                  />
                </div>
              </div>
              {formData.photo_2_url && (
                <img
                  src={formData.photo_2_url}
                  alt="Photo 3 preview"
                  className="h-24 w-auto rounded-lg object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>
          </div>
        )}

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