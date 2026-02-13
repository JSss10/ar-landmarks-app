'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { toast } from 'sonner'
import Modal from './Modal'
import { Landmark } from '@/lib/supabase/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

interface LandmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  landmark: Landmark | null
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

function toDateInputValue(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

function fromDateInputValue(value: string): string {
  if (!value) return ''
  const date = new Date(value + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6.5 w-11.5 shrink-0 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${checked ? 'bg-linear-to-r from-blue-500 to-cyan-400' : 'bg-gray-200'
          }`}
      >
        <span
          className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5.5' : 'translate-x-0.5'
            }`}
        />
      </button>
      <span className="text-[15px] text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
    </label>
  )
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-50/80 rounded-xl p-4 space-y-4 ${className}`}>
      {children}
    </div>
  )
}

function PhotoCard({
  index,
  url,
  caption,
  onUrlChange,
  onCaptionChange,
  inputClass
}: {
  index: number
  url: string
  caption: string
  onUrlChange: (value: string) => void
  onCaptionChange: (value: string) => void
  inputClass: string
}) {
  return (
    <div className="bg-gray-50/80 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Photo {index}</span>
        {url && (
          <span className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Added</span>
        )}
      </div>
      <div className="space-y-3">
        <input
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className={inputClass}
          placeholder="Image URL"
        />
        <input
          type="text"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          className={inputClass}
          placeholder="Caption"
        />
      </div>
      {url && (
        <div className="pt-1">
          <img
            src={url}
            alt={`Photo ${index}`}
            className="h-24 w-auto max-w-full rounded-lg object-cover shadow-sm"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}
    </div>
  )
}

export default function LandmarkModal({ isOpen, onClose, onSuccess, landmark }: LandmarkModalProps) {
  const supabase = getSupabaseBrowserClient()
  const dateInputRef = useRef<HTMLInputElement>(null)

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

      if (!landmark) {
        throw new Error('No landmark selected for editing')
      }

      const { error: updateError } = await supabase
        .from('landmarks')
        // @ts-ignore - Supabase client has no schema types
        .update(landmarkData)
        .eq('id', landmark.id)

      if (updateError) throw updateError

      toast.success('Landmark updated successfully')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 text-[15px] rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
  const labelClass = "block text-[13px] font-medium text-gray-500 mb-1.5"

  const tabs = [
    { id: 'basic', label: 'Basic' },
    { id: 'content', label: 'Content' },
    { id: 'location', label: 'Location' },
    { id: 'hours', label: 'Hours' },
    { id: 'photos', label: 'Photos' },
  ] as const

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Landmark"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center pb-2">
          <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'basic' && (
          <div className="space-y-5">
            <SectionCard>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className={labelClass}>Categories</label>
                  <input
                    type="text"
                    value={formData.api_categories}
                    onChange={(e) => setFormData({ ...formData, api_categories: e.target.value })}
                    className={inputClass}
                    placeholder="Culture, Museums (comma-separated)"
                  />
                </div>

                <div>
                  <label className={labelClass}>Tourism ID</label>
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
                    placeholder="e.g., Outdoors, Indoors"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex flex-wrap items-center gap-6">
                <Toggle
                  checked={formData.is_active}
                  onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  label="Active"
                />
                <Toggle
                  checked={formData.zurich_card}
                  onChange={(checked) => setFormData({ ...formData, zurich_card: checked })}
                  label="City Card"
                />
              </div>
            </SectionCard>

            <SectionCard>
              <div>
                <label className={labelClass}>Date Modified</label>
                <div className="relative">
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={toDateInputValue(formData.date_modified)}
                    onChange={(e) => setFormData({ ...formData, date_modified: e.target.value ? fromDateInputValue(e.target.value) : '' })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    tabIndex={-1}
                  />
                  <div
                    onClick={() => dateInputRef.current?.showPicker()}
                    className={inputClass + " cursor-pointer flex items-center justify-between"}
                  >
                    <span className={formData.date_modified ? "text-gray-900" : "text-gray-400"}>
                      {formData.date_modified ? formatDateForDisplay(formData.date_modified) : 'Select date'}
                    </span>
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-5">
            <SectionCard>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={inputClass + " resize-none"}
                  placeholder="Full description of the landmark"
                />
              </div>
            </SectionCard>

            <SectionCard>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Title Teaser</label>
                  <input
                    type="text"
                    value={formData.title_teaser}
                    onChange={(e) => setFormData({ ...formData, title_teaser: e.target.value })}
                    className={inputClass}
                    placeholder="Short teaser title"
                  />
                </div>

                <div>
                  <label className={labelClass}>Text Teaser</label>
                  <input
                    type="text"
                    value={formData.text_teaser}
                    onChange={(e) => setFormData({ ...formData, text_teaser: e.target.value })}
                    className={inputClass}
                    placeholder="Short teaser text"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div>
                <label className={labelClass}>Highlights</label>
                <textarea
                  value={formData.detailed_information}
                  onChange={(e) => setFormData({ ...formData, detailed_information: e.target.value })}
                  rows={4}
                  className={inputClass + " resize-none"}
                  placeholder="One highlight per line"
                />
                <p className="text-[12px] text-gray-400 mt-2">Enter each highlight on a new line</p>
              </div>
            </SectionCard>

            <SectionCard>
              <div>
                <label className={labelClass}>City Card Description</label>
                <textarea
                  value={formData.zurich_card_description}
                  onChange={(e) => setFormData({ ...formData, zurich_card_description: e.target.value })}
                  rows={2}
                  className={inputClass + " resize-none"}
                  placeholder="Benefits for City Card holders"
                />
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-5">
            <SectionCard>
              <h3 className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">Coordinates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </SectionCard>

            <SectionCard>
              <h3 className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </SectionCard>

            <SectionCard>
              <h3 className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className={labelClass}>Website</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-5">
            <SectionCard>
              <div>
                <label className={labelClass}>Opens</label>
                <input
                  type="text"
                  value={formData.opens}
                  onChange={(e) => setFormData({ ...formData, opens: e.target.value })}
                  className={inputClass}
                  placeholder="Monday, Tuesday, Wednesday..."
                />
              </div>
            </SectionCard>

            <SectionCard>
              <div>
                <label className={labelClass}>Opening Hours</label>
                <textarea
                  value={formData.opening_hours}
                  onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                  rows={3}
                  className={inputClass + " resize-none font-mono text-[13px]"}
                  placeholder='["Mo,Tu,We,Th,Fr,Sa 10:00:00-18:00:00","Su 12:30:00-18:00:00"]'
                />
                {formData.opening_hours && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Preview</p>
                    <pre className="text-[13px] text-gray-700 whitespace-pre-wrap font-sans">
                      {parseOpeningHours(formData.opening_hours)}
                    </pre>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard>
              <div>
                <label className={labelClass}>Special Hours</label>
                <textarea
                  value={formData.special_opening_hours}
                  onChange={(e) => setFormData({ ...formData, special_opening_hours: e.target.value })}
                  rows={3}
                  className={inputClass + " resize-none"}
                  placeholder="Holiday hours, seasonal changes, etc."
                />
              </div>
            </SectionCard>

            <SectionCard>
              <div>
                <label className={labelClass}>Price</label>
                <textarea
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  rows={3}
                  className={inputClass + " resize-none"}
                  placeholder="Admission prices and details"
                />
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-5">
            <SectionCard>
              <h3 className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">Main Image</h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Caption</label>
                  <input
                    type="text"
                    value={formData.image_caption}
                    onChange={(e) => setFormData({ ...formData, image_caption: e.target.value })}
                    className={inputClass}
                    placeholder="Image caption"
                  />
                </div>

                {formData.image_url && (
                  <div className="relative h-48 bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt="Main image preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            <div className="pt-2">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Photo Gallery</h3>
              <div className="space-y-4">
                <PhotoCard
                  index={1}
                  url={formData.photo_0_url}
                  caption={formData.photo_0_caption}
                  onUrlChange={(value) => setFormData({ ...formData, photo_0_url: value })}
                  onCaptionChange={(value) => setFormData({ ...formData, photo_0_caption: value })}
                  inputClass={inputClass}
                />
                <PhotoCard
                  index={2}
                  url={formData.photo_1_url}
                  caption={formData.photo_1_caption}
                  onUrlChange={(value) => setFormData({ ...formData, photo_1_url: value })}
                  onCaptionChange={(value) => setFormData({ ...formData, photo_1_caption: value })}
                  inputClass={inputClass}
                />
                <PhotoCard
                  index={3}
                  url={formData.photo_2_url}
                  caption={formData.photo_2_caption}
                  onUrlChange={(value) => setFormData({ ...formData, photo_2_url: value })}
                  onCaptionChange={(value) => setFormData({ ...formData, photo_2_caption: value })}
                  inputClass={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-200/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-[15px] font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-[15px] font-medium text-white bg-linear-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}