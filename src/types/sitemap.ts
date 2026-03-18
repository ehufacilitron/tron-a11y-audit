export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface Sitemap {
  urlset?: {
    url: SitemapUrl | SitemapUrl[];
  };
}

export interface SitemapIndex {
  sitemapindex?: {
    sitemap: SitemapIndexEntry | SitemapIndexEntry[];
  };
}

export interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}
