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
  disambiguating_description: string | null
  description: string | null
  description_en: string | null
  title_teaser: string | null
  text_teaser: string | null
  detailed_information: string[] | null
  zurich_card_description: string | null
  zurich_card: boolean | null
  latitude: number
  longitude: number
  category_id: string | null
  api_categories: string[] | null
  image_url: string | null
  image_caption: string | null
  price: string | null
  zurich_tourism_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  date_modified: string | null
  opens: string | null
  opening_hours: string | null
  opening_hours_specification: Record<string, any> | null
  special_opening_hours: string | null
  address_country: string | null
  street_address: string | null
  postal_code: string | null
  city: string | null
  phone: string | null
  email: string | null
  website_url: string | null
  place: string | null
  photo_0_url: string | null
  photo_0_caption: string | null
  photo_1_url: string | null
  photo_1_caption: string | null
  photo_2_url: string | null
  photo_2_caption: string | null
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