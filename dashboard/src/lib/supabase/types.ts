export interface Category {
  id: string
  name: string
  name_en: string | null
  icon: string | null
  color: string
  sort_order: number
  created_at: string
}

export interface Landmark {
  id: string
  name: string
  name_en: string | null
  description: string | null
  description_en: string | null
  latitude: number
  longitude: number
  altitude: number
  category_id: string | null
  image_url: string | null
  zurich_tourism_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  street_address: string | null
  postal_code: string | null
  city: string | null
  phone: string | null
  email: string | null
  website_url: string | null
  opening_hours: string | null
  api_source: string | null
  api_raw_data: Record<string, any> | null
  last_synced_at: string | null
  // Joined
  category?: Category
  photos?: LandmarkPhoto[]
  categories?: Category[]
}

export interface LandmarkPhoto {
  id: string
  landmark_id: string
  photo_url: string
  caption: string | null
  caption_en: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface LandmarkCategory {
  id: string
  landmark_id: string
  category_id: string
  created_at: string
  category?: Category
}