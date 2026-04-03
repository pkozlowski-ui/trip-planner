/**
 * Wikimedia enrichment: Wikidata, Wikipedia, Commons
 * Fetches descriptions, images (with CC attribution), official websites.
 * No API keys; use cache and reasonable User-Agent.
 */

import type { ImageAttribution } from '../types';

const USER_AGENT = 'TripPlanner/1.0 (https://github.com/trip-planner)';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const WIKIDATA_ORIGIN = 'https://www.wikidata.org';
const COMMONS_ORIGIN = 'https://commons.wikimedia.org';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const enrichmentCache = new Map<string, CacheEntry<EnrichedLocationData>>();

export interface EnrichedLocationData {
  description?: string;
  image?: string;
  imageAttribution?: ImageAttribution;
  website?: string;
  inception?: string;
  wikipediaUrl?: string;
  wikipediaTitle?: string;
  wikipediaLang?: string;
}

function cacheKey(qId: string, lang: string): string {
  return `${qId}:${lang}`;
}

function getPreferredLang(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const code = navigator.language.split('-')[0];
    if (code && /^[a-z]{2}$/i.test(code)) return code;
  }
  return 'en';
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Get Wikidata entity: labels, descriptions, claims (P856, P18, P571), sitelinks
 */
async function getWikidataEntity(
  qId: string,
  lang: string,
  signal?: AbortSignal
): Promise<{
  description?: string;
  website?: string;
  imageFilename?: string;
  inception?: string;
  wikipediaTitle?: string;
  wikipediaLang?: string;
}> {
  const url = `${WIKIDATA_ORIGIN}/w/api.php?${new URLSearchParams({
    action: 'wbgetentities',
    ids: qId,
    props: 'labels|descriptions|claims|sitelinks',
    languages: `${lang}|en`,
    format: 'json',
    origin: '*',
  })}`;
  const data = await fetchJson<{
    entities?: Record<
      string,
      {
        descriptions?: Record<string, { value?: string }>;
        claims?: Record<
          string,
          Array<{ mainsnak?: { datavalue?: { value?: string } } }>
        >;
        sitelinks?: Record<string, { title?: string; site?: string }>;
      }
    >;
  }>(url, signal);

  const entity = data.entities?.[qId];
  if (!entity) return {};

  const desc =
    entity.descriptions?.[lang]?.value ?? entity.descriptions?.en?.value;
  const claims = entity.claims ?? {};

  const getFirstString = (prop: string): string | undefined => {
    const arr = claims[prop];
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    const v = arr[0].mainsnak?.datavalue?.value;
    return typeof v === 'string' ? v : undefined;
  };

  const website = getFirstString('P856');
  const imageFilename = getFirstString('P18');
  const inceptionClaim = claims['P571'];
  let inception: string | undefined;
  if (Array.isArray(inceptionClaim) && inceptionClaim[0].mainsnak?.datavalue?.value) {
    const v = inceptionClaim[0].mainsnak!.datavalue!.value as { time?: string };
    if (v && typeof v.time === 'string') inception = v.time;
  }

  const sitelinks = entity.sitelinks ?? {};
  const wikiSite = sitelinks[`${lang}wiki`] ?? sitelinks.enwiki;
  const wikipediaTitle = wikiSite?.title;
  const wikipediaLang = wikiSite ? (wikiSite.site?.replace('wiki', '') ?? lang) : undefined;

  return {
    description: desc,
    website,
    imageFilename,
    inception,
    wikipediaTitle,
    wikipediaLang: wikipediaLang || lang,
  };
}

/**
 * Get Wikipedia extract (lead) as plain text
 */
async function getWikipediaExtract(
  pageTitle: string,
  lang: string,
  signal?: AbortSignal
): Promise<string | undefined> {
  const origin = `https://${lang}.wikipedia.org`;
  const title = pageTitle.replace(/ /g, '_');
  const url = `${origin}/w/api.php?${new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    exintro: 'true',
    explaintext: 'true',
    exchars: '500',
    titles: title,
    format: 'json',
    origin: '*',
  })}`;
  const data = await fetchJson<{
    query?: { pages?: Record<string, { extract?: string }> };
  }>(url, signal);
  const pages = data.query?.pages;
  if (!pages) return undefined;
  const page = Object.values(pages)[0];
  return page?.extract;
}

/**
 * Commons image URL from filename (P18 value)
 */
function getCommonsImageUrl(filename: string): string {
  return `${COMMONS_ORIGIN}/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

/**
 * Commons API: imageinfo for license/author
 */
async function getCommonsImageInfo(
  filename: string,
  signal?: AbortSignal
): Promise<ImageAttribution | undefined> {
  const title = filename.startsWith('File:') ? filename : `File:${filename}`;
  const url = `${COMMONS_ORIGIN}/w/api.php?${new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'extmetadata',
    format: 'json',
    origin: '*',
  })}`;
  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: Array<{
            extmetadata?: {
              Artist?: { value?: string };
              LicenseShortName?: { value?: string };
              License?: { value?: string };
              Credit?: { value?: string };
            };
          }>;
        }
      >;
    };
  }>(url, signal);

  const pages = data.query?.pages;
  if (!pages) return undefined;
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0]?.extmetadata;
  if (!info) return undefined;

  const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').trim();
  const author =
    info.Artist?.value != null
      ? stripHtml(info.Artist.value)
      : info.Credit?.value != null
        ? stripHtml(info.Credit.value)
        : undefined;
  const license =
    info.LicenseShortName?.value != null
      ? stripHtml(info.LicenseShortName.value)
      : info.License?.value != null
        ? stripHtml(info.License.value)
        : undefined;

  return {
    author,
    license,
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename.replace(/^File:/, ''))}`,
  };
}

/**
 * Enrich location data from Wikidata Q-id.
 * Uses cache; runs Wikidata → optional Wikipedia extract → optional Commons image + metadata.
 */
export async function enrichLocationFromWikidata(
  qId: string,
  preferredLang?: string,
  signal?: AbortSignal
): Promise<EnrichedLocationData> {
  const lang = preferredLang || getPreferredLang();
  const key = cacheKey(qId, lang);
  const cached = enrichmentCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const result: EnrichedLocationData = {};

  try {
    const entity = await getWikidataEntity(qId, lang, signal);
    result.description = entity.description;
    result.website = entity.website;
    result.inception = entity.inception;
    result.wikipediaLang = entity.wikipediaLang;
    result.wikipediaTitle = entity.wikipediaTitle;

    if (entity.wikipediaTitle && entity.wikipediaLang) {
      try {
        const extract = await getWikipediaExtract(
          entity.wikipediaTitle,
          entity.wikipediaLang,
          signal
        );
        if (extract) result.description = extract;
        result.wikipediaUrl = `https://${entity.wikipediaLang}.wikipedia.org/wiki/${entity.wikipediaTitle.replace(/ /g, '_')}`;
      } catch {
        // keep Wikidata description if Wikipedia fails
      }
    }

    if (entity.imageFilename) {
      result.image = getCommonsImageUrl(entity.imageFilename);
      try {
        result.imageAttribution = await getCommonsImageInfo(
          entity.imageFilename,
          signal
        );
      } catch {
        result.imageAttribution = {
          sourceUrl: result.image,
          license: 'See source',
        };
      }
    }

    enrichmentCache.set(key, { data: result, timestamp: Date.now() });
  } catch (e) {
    console.warn('[wikimedia] Enrichment failed for', qId, e);
  }

  return result;
}

/**
 * Extract Wikidata Q-id from OSM value (e.g. "Q123" or "Q12345")
 */
export function parseWikidataId(value: string | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const m = value.trim().match(/^(Q\d+)$/i);
  return m ? m[1] : null;
}

const searchCache = new Map<string, { qId: string | null; timestamp: number }>();
const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Search Wikidata by location name (e.g. "Buckingham Palace") and return the first entity Q-id.
 * Used when a location has no wikidataId (e.g. added from map click) so we can still fetch image.
 */
export async function searchWikidataByQuery(
  query: string,
  signal?: AbortSignal
): Promise<string | null> {
  const trimmed = query?.trim();
  if (!trimmed || trimmed.length < 2) return null;

  const cacheKey = `search:${trimmed.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.qId;
  }

  try {
    const url = `${WIKIDATA_ORIGIN}/w/api.php?${new URLSearchParams({
      action: 'wbsearchentities',
      search: trimmed,
      language: getPreferredLang(),
      limit: '5',
      format: 'json',
      origin: '*',
    })}`;
    const data = await fetchJson<{
      search?: Array<{ id?: string }>;
    }>(url, signal);
    const first = data.search?.[0]?.id;
    const qId = first && parseWikidataId(first) ? first : null;
    searchCache.set(cacheKey, { qId, timestamp: Date.now() });
    return qId;
  } catch {
    searchCache.set(cacheKey, { qId: null, timestamp: Date.now() });
    return null;
  }
}

const MAX_CONCURRENT_ENRICH = 4;

/**
 * Enrich multiple Q-ids with a concurrency limit. Returns a Map of qId -> EnrichedLocationData.
 * Skips invalid ids; failed enrichments are omitted from the map.
 */
export async function enrichBatch(
  qIds: string[],
  preferredLang?: string,
  signal?: AbortSignal
): Promise<Map<string, EnrichedLocationData>> {
  const results = new Map<string, EnrichedLocationData>();
  const valid = qIds.filter((id) => parseWikidataId(id));
  let index = 0;

  const runNext = async (): Promise<void> => {
    if (signal?.aborted) return;
    const i = index++;
    if (i >= valid.length) return;
    const qId = valid[i];
    try {
      const data = await enrichLocationFromWikidata(qId, preferredLang, signal);
      if (Object.keys(data).length > 0) results.set(qId, data);
    } catch {
      // skip failed
    }
    await runNext();
  };

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT_ENRICH, valid.length) },
    () => runNext()
  );
  await Promise.all(workers);
  return results;
}
