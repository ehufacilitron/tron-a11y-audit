import { XMLParser } from 'fast-xml-parser';
import type { AuditConfig } from '../types/audit-config.js';
import type { Sitemap, SitemapIndex, SitemapUrl } from '../types/sitemap.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

/**
 * Discover all page URLs from sitemap(s).
 * Tries the sitemap index first, falls back to explicit sitemapPaths,
 * then falls back to just the baseUrl.
 */
export async function discoverUrls(config: AuditConfig): Promise<string[]> {
  const { baseUrl, sitemapIndexPath, sitemapPaths } = config;
  let urls: string[] = [];

  // Try sitemap index first
  try {
    console.log(`[sitemap] Fetching sitemap index: ${baseUrl}${sitemapIndexPath}`);
    const indexXml = await fetchText(`${baseUrl}${sitemapIndexPath}`);
    const parsed = parser.parse(indexXml) as SitemapIndex;

    if (parsed.sitemapindex?.sitemap) {
      const entries = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];

      console.log(`[sitemap] Found ${entries.length} child sitemap(s)`);

      for (const entry of entries) {
        const childUrls = await fetchSitemap(entry.loc);
        urls.push(...childUrls);
      }
    } else {
      // Might be a regular sitemap, not an index
      const childUrls = extractUrlsFromSitemap(indexXml);
      urls.push(...childUrls);
    }
  } catch (err) {
    console.warn(`[sitemap] Could not fetch sitemap index: ${(err as Error).message}`);
  }

  // Fallback to explicit paths
  if (urls.length === 0 && sitemapPaths.length > 0) {
    console.log(`[sitemap] Trying ${sitemapPaths.length} explicit sitemap path(s)`);
    for (const path of sitemapPaths) {
      const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
      try {
        const childUrls = await fetchSitemap(fullUrl);
        urls.push(...childUrls);
      } catch (err) {
        console.warn(`[sitemap] Failed to fetch ${fullUrl}: ${(err as Error).message}`);
      }
    }
  }

  // Final fallback — just scan the base URL
  if (urls.length === 0) {
    console.warn('[sitemap] No URLs discovered from sitemaps, falling back to baseUrl');
    urls.push(baseUrl);
  }

  // Deduplicate and filter
  urls = deduplicateUrls(urls);
  urls = filterUrls(urls);

  console.log(`[sitemap] Discovered ${urls.length} unique page URL(s)`);
  return urls;
}

async function fetchSitemap(url: string): Promise<string[]> {
  const xml = await fetchText(url);
  return extractUrlsFromSitemap(xml);
}

function extractUrlsFromSitemap(xml: string): string[] {
  const parsed = parser.parse(xml) as Sitemap;
  if (!parsed.urlset?.url) return [];

  const entries: SitemapUrl[] = Array.isArray(parsed.urlset.url)
    ? parsed.urlset.url
    : [parsed.urlset.url];

  return entries.map((entry) => entry.loc).filter(Boolean);
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function deduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    // Normalize: remove trailing slash, lowercase
    const normalized = url.replace(/\/+$/, '').toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/**
 * Filter out non-HTML resources and common noise.
 */
function filterUrls(urls: string[]): string[] {
  const excludeExtensions = ['.pdf', '.xml', '.json', '.txt', '.jpg', '.png', '.gif', '.svg', '.webp', '.css', '.js'];

  return urls.filter((url) => {
    const path = new URL(url).pathname.toLowerCase();

    // Exclude file extensions that aren't HTML pages
    if (excludeExtensions.some((ext) => path.endsWith(ext))) return false;

    // Exclude common non-page paths
    if (path.startsWith('/api/') || path.startsWith('/_')) return false;

    return true;
  });
}
