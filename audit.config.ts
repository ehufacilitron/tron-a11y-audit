import type { AuditConfig } from './src/types/audit-config.js';

const config: AuditConfig = {
  // ──────────────────────────────────────────────
  // Required — the base URL of the site to audit
  // ──────────────────────────────────────────────
  baseUrl: 'https://www.facilitron.com/',

  // ──────────────────────────────────────────────
  // Sitemap discovery
  // ──────────────────────────────────────────────
  // Path to the sitemap index (or a single sitemap)
  sitemapIndexPath: '/sitemap.xml',

  // Explicit sitemap paths — used as fallback if the index fetch fails
  sitemapPaths: [],

  // ──────────────────────────────────────────────
  // Scanning
  // ──────────────────────────────────────────────
  // Max pages to scan concurrently (browser tabs)
  maxConcurrentPages: 3,

  // Timeout per page navigation (ms)
  pageTimeout: 30000,

  // Time to wait for SPA hydration after load (ms)
  hydrationTimeout: 10000,

  // Maximum pages to scan (0 = unlimited, useful for test runs)
  maxPages: 0,

  // ──────────────────────────────────────────────
  // WCAG
  // ──────────────────────────────────────────────
  wcagLevel: 'AA',

  // CSS selectors to exclude from scanning (e.g. third-party widgets)
  excludeSelectors: [],

  // ──────────────────────────────────────────────
  // Interaction triggers
  // ──────────────────────────────────────────────
  // Custom interaction triggers to run before scanning each page.
  // Each trigger has: name, selector, action ('click' | 'hover' | 'focus'),
  // and optional waitFor selector.
  //
  // Example:
  // interactionTriggers: [
  //   { name: 'Open login modal', selector: '[data-testid="login-btn"]', action: 'click', waitFor: '.login-modal' },
  // ],
  interactionTriggers: [],

  // Whether to run the built-in triggers (modals, dropdowns, accordions)
  enableDefaultTriggers: true,

  // ──────────────────────────────────────────────
  // Vue component resolution (optional)
  // ──────────────────────────────────────────────
  // Enables walking the Vue 3 component tree to map DOM nodes to .vue files.
  // Only works when scanning a Vue dev server (not production builds).
  enableComponentResolution: false,

  // Root directory of the Vue project (used to shorten file paths)
  projectRoot: process.cwd(),

  // ──────────────────────────────────────────────
  // Component patterns (optional)
  // ──────────────────────────────────────────────
  // Maps CSS selectors to human-readable component names.
  // Useful for identifying which component owns a violation.
  //
  // Example:
  // componentPatterns: [
  //   { selector: '.btn, button.primary', name: 'Button', tier: 'base' },
  //   { selector: '.card, .card-*', name: 'Card', tier: 'display' },
  //   { selector: '.hero-section', name: 'HeroSection', tier: 'section' },
  // ],
  componentPatterns: [],

  // ──────────────────────────────────────────────
  // Output
  // ──────────────────────────────────────────────
  outputDir: './output',
};

export default config;
