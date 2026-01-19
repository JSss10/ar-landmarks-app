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
  const descriptionEn = stripHtml(poi.description?.en) || stripHtml(poi.disambiguatingDescription?.en);
  const promotionalTextEn = poi.textTeaser?.en || poi.disambiguatingDescription?.en;

  const primaryImage = poi.image?.url || (poi.photo && poi.photo[0]?.url) || null;
  const address = poi.address || {};
  const coords = poi.geoCoordinates || {};
  const categoryName = extractCategory(poi.category);

  return {
    name: nameEn,
    name_en: nameEn,
    description: descriptionEn,
    description_en: descriptionEn,
    latitude: coords.latitude || 47.3769,
    longitude: coords.longitude || 8.5417,
    altitude: 408,
    street_address: address.streetAddress,
    postal_code: address.postalCode,
    city: address.addressLocality || 'Zürich',
    phone: address.telephone,
    email: address.email,
    website_url: address.url,
    promotional_text_en: promotionalTextEn,
    image_url: primaryImage,
    zurich_tourism_id: poi.identifier,
    api_source: 'zurich_tourism',
    api_raw_data: poi,
    last_synced_at: new Date().toISOString(),
    is_active: true,
    category_name: categoryName,
    opening_hours: poi.openingHours,
    opening_hours_data: poi.openingHoursSpecification,
    photos: poi.photo || []
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