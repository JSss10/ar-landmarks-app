import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ZURICH_API_BASE = 'https://www.zuerich.com/en/api/v2/data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec)))
    .trim();
}

function extractCategory(categoryObj: Record<string, any> | null): string | null {
  if (!categoryObj) return null;
  const categories = Object.keys(categoryObj);
  return categories.length > 0 ? categories[0] : null;
}

function extractCategories(categoryObj: Record<string, any> | null): string[] {
  if (!categoryObj) return [];
  return Object.keys(categoryObj);
}

function formatPrice(price: string | null | undefined): string | null {
  if (!price) return null;
  const trimmed = price.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null') return null;
  return trimmed;
}

async function findOrCreateCategory(categoryName: string): Promise<string | null> {
  if (!categoryName) return null;

  const { data: existing, error: fetchError } = await supabase
    .from('categories')
    .select('id')
    .ilike('name_en', categoryName)
    .single();

  if (existing) {
    return existing.id;
  }

  const { data: newCategory, error: createError } = await supabase
    .from('categories')
    .insert({
      name: categoryName,
      name_en: categoryName,
      color: '#3B82F6',
      sort_order: 999
    })
    .select('id')
    .single();

  if (createError) {
    console.error(`Error creating category "${categoryName}":`, createError);
    return null;
  }

  return newCategory.id;
}

async function syncLandmarkPhotos(landmarkId: string, photos: any[]): Promise<void> {
  if (!photos || photos.length === 0) return;

  await supabase
    .from('landmark_photos')
    .delete()
    .eq('landmark_id', landmarkId);

  const photoInserts = photos.map((photo, index) => ({
    landmark_id: landmarkId,
    photo_url: photo.url,
    caption_en: photo.caption?.en,
    sort_order: index,
    is_primary: index === 0
  }));

  await supabase.from('landmark_photos').insert(photoInserts);
}

async function linkLandmarkCategory(landmarkId: string, categoryId: string): Promise<void> {
  if (!categoryId) return;

  await supabase
    .from('landmark_categories')
    .upsert({
      landmark_id: landmarkId,
      category_id: categoryId
    }, {
      onConflict: 'landmark_id,category_id'
    });
}

function transformPOI(poi: any) {
  const nameEn = poi.name?.en || poi.name?.de || 'Unknown';
  const disambiguatingDescription = stripHtml(poi.disambiguatingDescription?.en);
  const descriptionEn = stripHtml(poi.description?.en);
  const titleTeaser = poi.titleTeaser?.en || null;
  const textTeaser = poi.textTeaser?.en || null;
  const detailedInformation = Array.isArray(poi.detailedInformation?.en) ? poi.detailedInformation.en : null;
  const zurichCardDescription = poi.zurichCardDescription || null;
  const zurichCard = typeof poi.zurichCard === 'boolean' ? poi.zurichCard : null;

  const primaryImage = poi.image?.url || null;
  const imageCaption = poi.image?.caption?.en || null;
  const price = formatPrice(poi.price?.en);

  const address = poi.address || {};
  const coords = poi.geoCoordinates || {};
  const categoryName = extractCategory(poi.category);
  const apiCategories = extractCategories(poi.category);

  const photos = poi.photo || [];

  return {
    name: nameEn,
    name_en: nameEn,
    disambiguating_description: disambiguatingDescription,
    description: descriptionEn || disambiguatingDescription,
    description_en: descriptionEn,
    title_teaser: titleTeaser,
    text_teaser: textTeaser,
    detailed_information: detailedInformation,
    zurich_card_description: zurichCardDescription,
    zurich_card: zurichCard,
    latitude: coords.latitude || 47.3769,
    longitude: coords.longitude || 8.5417,
    api_categories: apiCategories.length > 0 ? apiCategories : null,
    image_url: primaryImage,
    image_caption: imageCaption,
    price: price,
    date_modified: poi.dateModified || null,
    opens: poi.opens || null,
    opening_hours: poi.openingHours || null,
    opening_hours_specification: poi.openingHoursSpecification || null,
    special_opening_hours: poi.specialOpeningHoursSpecification?.en || null,
    address_country: address.addressCountry || null,
    street_address: address.streetAddress || null,
    postal_code: address.postalCode || null,
    city: address.addressLocality || 'Zürich',
    phone: address.telephone || null,
    email: address.email || null,
    website_url: address.url || null,
    place: Array.isArray(poi.place) && poi.place.length > 0 ? poi.place[0] : null,
    photo_0_url: photos[0]?.url || null,
    photo_0_caption: photos[0]?.caption?.en || null,
    photo_1_url: photos[1]?.url || null,
    photo_1_caption: photos[1]?.caption?.en || null,
    photo_2_url: photos[2]?.url || null,
    photo_2_caption: photos[2]?.caption?.en || null,
    zurich_tourism_id: poi.identifier,
    api_source: 'zurich_tourism',
    api_raw_data: poi,
    last_synced_at: new Date().toISOString(),
    is_active: true,
    category_name: categoryName,
    photos: photos
  };
}

async function syncPOI(poi: any): Promise<{ success: boolean; name: string; error?: string }> {
  const transformed = transformPOI(poi);
  const { category_name, photos, ...landmarkData } = transformed;

  try {
    const { data: existing } = await supabase
      .from('landmarks')
      .select('id')
      .eq('zurich_tourism_id', landmarkData.zurich_tourism_id)
      .single();

    let landmarkId: string;

    if (existing) {
      const { data, error } = await supabase
        .from('landmarks')
        .update(landmarkData)
        .eq('id', existing.id)
        .select('id')
        .single();

      if (error) throw error;
      landmarkId = data.id;
    } else {
      const { data, error } = await supabase
        .from('landmarks')
        .insert(landmarkData)
        .select('id')
        .single();

      if (error) throw error;
      landmarkId = data.id;
    }

    if (photos && photos.length > 0) {
      await syncLandmarkPhotos(landmarkId, photos);
    }

    if (category_name) {
      const categoryId = await findOrCreateCategory(category_name);
      if (categoryId) {
        await linkLandmarkCategory(landmarkId, categoryId);
      }
    }

    return { success: true, name: landmarkData.name_en || 'Unknown' };
  } catch (error) {
    console.error('Error syncing POI:', error);
    return {
      success: false,
      name: landmarkData.name_en || 'Unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const categoryId = body.categoryId || 72;

    const response = await fetch(`${ZURICH_API_BASE}?id=${categoryId}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const pois = await response.json();

    if (!pois || pois.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No POIs found',
        count: 0,
        results: []
      });
    }

    const results = await Promise.all(pois.map(syncPOI));

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} POIs${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      count: successCount,
      total: pois.length,
      results
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}