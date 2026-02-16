#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const ZURICH_API_BASE = "https://www.zuerich.com/en/api/v2/data";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Fetches POI data from Zurich Tourism API
 * @param {string|number} id - The POI ID to fetch (e.g., 72 for viewpoints)
 * @returns {Promise<Array>} Array of POI objects
 */
async function fetchZurichPOIs(id = 72) {
  const url = `${ZURICH_API_BASE}?id=${id}`;

  console.log(`Fetching POIs from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(`✓ Fetched ${data.length} POIs from Zurich API`);

    return data;
  } catch (error) {
    console.error("Failed to fetch POIs from Zurich API:", error);
    throw error;
  }
}

/**
 * Strips HTML tags from a string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
function stripHtml(html) {
  if (!html) return null;
  const result = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec)))
    .replace(/&[a-zA-Z]+;/g, "")
    .trim();
  return ensurePeriodSpacing(result);
}

/**
 * Ensures a space exists after periods followed by a letter (e.g. "sentence1.Sentence2" → "sentence1. Sentence2")
 * @param {string} text - Input text
 * @returns {string} Text with proper spacing after periods
 */
function ensurePeriodSpacing(text) {
  if (!text) return text;
  return text.replace(/\.(?=[A-ZÄÖÜ])/g, ". ");
}

function formatOpens(opens) {
  if (!opens) return null;
  return opens.replace(/,(?!\s)/g, ", ").trim() || null;
}

function formatOpeningHours(hours) {
  if (!hours) return null;
  if (Array.isArray(hours)) {
    return hours.join(", ");
  }
  const str = String(hours);
  return (
    str
      .replace(/^\[|\]$/g, "")
      .replace(/"/g, "")
      .trim() || null
  );
}

/**
 * Extracts category name from Zurich API category object
 * @param {Object} categoryObj - Category object from API
 * @returns {string|null} First category name found
 */
function extractCategory(categoryObj) {
  if (!categoryObj) return null;

  const categories = Object.keys(categoryObj);
  return categories.length > 0 ? categories[0] : null;
}

/**
 * Finds or creates a category in the database
 * @param {string} categoryName - Category name
 * @returns {Promise<string|null>} Category UUID
 */
async function findOrCreateCategory(categoryName) {
  if (!categoryName) return null;

  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("id")
    .ilike("name_en", categoryName)
    .single();

  if (existing) {
    return existing.id;
  }

  const { data: newCategory, error: createError } = await supabase
    .from("categories")
    .insert({
      name: categoryName,
      name_en: categoryName,
      color: "#3B82F6",
      sort_order: 999,
    })
    .select("id")
    .single();

  if (createError) {
    console.error(`Error creating category "${categoryName}":`, createError);
    return null;
  }

  console.log(`  ✓ Created new category: ${categoryName}`);
  return newCategory.id;
}

/**
 * Transforms Zurich API POI data to our database schema
 * @param {Object} poi - POI object from Zurich API
 * @returns {Object} Transformed landmark object
 */
function transformPOI(poi) {
  const nameEn = poi.name?.en || poi.name?.de || "Unknown";
  const descriptionEn =
    stripHtml(poi.description?.en) ||
    stripHtml(poi.disambiguatingDescription?.en);

  const primaryImage =
    poi.image?.url || (poi.photo && poi.photo[0]?.url) || null;

  const address = poi.address || {};

  const coords = poi.geoCoordinates || {};

  const categoryName = extractCategory(poi.category);

  const zurichCardDescriptionRaw = poi.zurichCardDescription;
  const zurichCardDescription = stripHtml(
    typeof zurichCardDescriptionRaw === "object" &&
      zurichCardDescriptionRaw !== null
      ? zurichCardDescriptionRaw.en || zurichCardDescriptionRaw.de || null
      : zurichCardDescriptionRaw,
  );

  return {
    name: nameEn,
    name_en: nameEn,
    description: descriptionEn,
    description_en: descriptionEn,
    title_teaser: stripHtml(poi.titleTeaser?.en),
    text_teaser: stripHtml(poi.textTeaser?.en),
    zurich_card_description: zurichCardDescription,
    zurich_card: typeof poi.zurichCard === "boolean" ? poi.zurichCard : null,
    price: stripHtml(poi.price?.en) || null,

    latitude: coords.latitude || 47.3769,
    longitude: coords.longitude || 8.5417,

    street_address: address.streetAddress,
    postal_code: address.postalCode,
    city: address.addressLocality || "Zürich",
    phone: address.telephone,
    email: address.email,
    website_url: address.url,
    image_url: primaryImage,
    zurich_tourism_id: poi.identifier,
    api_source: "zurich_tourism",
    api_raw_data: poi,
    last_synced_at: new Date().toISOString(),

    is_active: true,

    category_name: categoryName,
    opens: formatOpens(poi.opens),
    opening_hours: formatOpeningHours(poi.openingHours),
    special_opening_hours: stripHtml(poi.specialOpeningHoursSpecification?.en),
    photos: poi.photo || [],
  };
}

/**
 * Syncs photos for a landmark
 * @param {string} landmarkId - Landmark UUID
 * @param {Array} photos - Array of photo objects from API
 */
async function syncLandmarkPhotos(landmarkId, photos) {
  if (!photos || photos.length === 0) return;

  await supabase.from("landmark_photos").delete().eq("landmark_id", landmarkId);

  const photoInserts = photos.map((photo, index) => ({
    landmark_id: landmarkId,
    photo_url: photo.url,
    caption_en: photo.caption?.en,
    sort_order: index,
    is_primary: index === 0,
  }));

  const { error } = await supabase.from("landmark_photos").insert(photoInserts);

  if (error) {
    console.error(`  ✗ Failed to sync photos:`, error);
  } else {
    console.log(`  ✓ Synced ${photos.length} photos`);
  }
}

/**
 * Links a landmark to a category
 * @param {string} landmarkId - Landmark UUID
 * @param {string} categoryId - Category UUID
 */
async function linkLandmarkCategory(landmarkId, categoryId) {
  if (!categoryId) return;

  const { error } = await supabase.from("landmark_categories").upsert(
    {
      landmark_id: landmarkId,
      category_id: categoryId,
    },
    {
      onConflict: "landmark_id,category_id",
    },
  );

  if (error) {
    console.error(`  ✗ Failed to link category:`, error);
  }
}

/**
 * Syncs a single POI to the database
 * @param {Object} poi - Transformed POI object
 */
async function syncPOI(poi) {
  const transformed = transformPOI(poi);
  const { category_name, photos, ...landmarkData } = transformed;

  console.log(`\nSyncing: ${landmarkData.name_en}`);

  const { data: existing } = await supabase
    .from("landmarks")
    .select("id")
    .eq("zurich_tourism_id", landmarkData.zurich_tourism_id)
    .single();

  let landmarkId;

  if (existing) {
    const { data, error } = await supabase
      .from("landmarks")
      .update(landmarkData)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ Failed to update:`, error);
      return;
    }

    landmarkId = data.id;
    console.log(`  ✓ Updated existing landmark`);
  } else {
    const { data, error } = await supabase
      .from("landmarks")
      .insert(landmarkData)
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ Failed to insert:`, error);
      return;
    }

    landmarkId = data.id;
    console.log(`  ✓ Created new landmark`);
  }

  if (photos && photos.length > 0) {
    await syncLandmarkPhotos(landmarkId, photos);
  }

  if (category_name) {
    const categoryId = await findOrCreateCategory(category_name);
    if (categoryId) {
      await linkLandmarkCategory(landmarkId, categoryId);
      console.log(`  ✓ Linked to category: ${category_name}`);
    }
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log("Starting Zurich POI Sync...\n");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("   Missing required environment variables:");
    console.error("   SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
    console.error("   SUPABASE_SERVICE_KEY:", SUPABASE_SERVICE_KEY ? "✓" : "✗");
    process.exit(1);
  }

  try {
    const poiId = process.argv[2] || 72;

    const pois = await fetchZurichPOIs(poiId);

    if (!pois || pois.length === 0) {
      console.log("No POIs found");
      return;
    }

    for (const poi of pois) {
      await syncPOI(poi);
    }

    console.log(`\n Sync complete! Processed ${pois.length} POIs`);
  } catch (error) {
    console.error("\n Sync failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchZurichPOIs, transformPOI, syncPOI };
