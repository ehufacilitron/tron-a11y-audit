# tron-a11y-audit

Automated WCAG 2.1 accessibility auditing tool that crawls your website via sitemaps, scans every page with axe-core through a headless Chromium browser, deduplicates violations across the entire site, and generates actionable reports in multiple formats (HTML, JSON, CSV for Jira, and a condensed format for LLM analysis).

## Prerequisites

- **Node.js** 18+ (with npm or bun)
- **A running website to scan** — typically your local dev server (`http://localhost:3000`)

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> tron-a11y-audit
cd tron-a11y-audit

# 2. Install dependencies (also installs Chromium via Playwright)
npm install

# 3. Configure your target
#    Edit audit.config.ts — at minimum, set baseUrl to your site
nano audit.config.ts

# 4. Start your dev server (in another terminal)
# e.g.: npm run dev

# 5. Run the full audit (scan + generate reports)
npm run audit
```

Your reports will be in `./output/reports/`.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run scan` | Crawl sitemaps, scan all pages, write raw + aggregated JSON |
| `npm run report` | Generate HTML, CSV, JSON, and LLM reports from aggregated data |
| `npm run audit` | Run scan then report in sequence |

You can also run the scripts directly:

```bash
npx tsx src/scanner/audit-runner.ts
npx tsx src/reports/generate-reports.ts
```

## Configuration Reference

All configuration lives in `audit.config.ts` at the project root.

### Required

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `'http://localhost:3000'` | The base URL of the site to scan. |

### Sitemap Discovery

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sitemapIndexPath` | `string` | `'/sitemap.xml'` | Path to the sitemap index or sitemap file. Appended to `baseUrl`. |
| `sitemapPaths` | `string[]` | `[]` | Explicit sitemap paths to try if the index fails. Example: `['/sitemap-pages.xml', '/sitemap-products.xml']` |

The crawler first tries `sitemapIndexPath` as a sitemap index (containing `<sitemapindex>`). If that's a regular sitemap, it extracts URLs directly. If both fail, it falls back to `sitemapPaths`. If no URLs are discovered at all, it scans just the `baseUrl`.

### Scanning

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxConcurrentPages` | `number` | `3` | Browser tabs to run in parallel. Higher = faster but more memory. |
| `pageTimeout` | `number` | `30000` | Navigation timeout per page in milliseconds. |
| `hydrationTimeout` | `number` | `10000` | Time to wait for SPA framework hydration (Vue, React, etc.). |
| `maxPages` | `number` | `0` | Limit the number of pages to scan. `0` = unlimited. Useful for test runs. |

### WCAG

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wcagLevel` | `'A' \| 'AA' \| 'AAA'` | `'AA'` | WCAG conformance level to test against. |
| `excludeSelectors` | `string[]` | `[]` | CSS selectors to exclude from scanning (e.g., third-party widgets). |

### Interaction Triggers

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableDefaultTriggers` | `boolean` | `true` | Run built-in triggers for common patterns (modals, dropdowns, accordions, tabs, tooltips, mobile nav). |
| `interactionTriggers` | `InteractionTrigger[]` | `[]` | Custom triggers to run before scanning. See [Adding Custom Triggers](#adding-custom-interaction-triggers). |

### Vue Component Resolution (Optional)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableComponentResolution` | `boolean` | `false` | Walk the Vue 3 component tree to map violations to `.vue` source files. Only works with dev servers. |
| `projectRoot` | `string` | `process.cwd()` | Root directory of the Vue project (for shortening file paths in reports). |

### Component Patterns (Optional)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `componentPatterns` | `ComponentPattern[]` | `[]` | Map CSS selectors to component names and tiers. Helps identify which component owns a violation. |

Example:

```ts
componentPatterns: [
  { selector: '.btn, button.primary', name: 'Button', tier: 'base' },
  { selector: '.card, .card-*', name: 'Card', tier: 'display' },
  { selector: '.hero-section', name: 'HeroSection', tier: 'section' },
],
```

### Output

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputDir` | `string` | `'./output'` | Directory for all generated files. |

## Understanding Results

### Output Directory Structure

```
output/
├── raw/                          # One JSON file per scanned page
│   ├── index.json
│   ├── about.json
│   └── ...
├── aggregated/
│   └── aggregated-results.json   # All pages combined, violations deduplicated
└── reports/
    ├── audit-report.html         # Visual report — open in a browser
    ├── audit-report.json         # Full enriched data with WCAG mappings
    ├── jira-import.csv           # Import directly into Jira
    └── llm-report.json           # Condensed format for AI analysis
```

### Deduplication

The same violation appearing on 50 different pages becomes **1 violation group** with `count: 50` and a list of all affected pages. This prevents a single site-wide issue (like a missing skip-nav link) from flooding the report with 50 duplicate entries.

Deduplication key: `ruleId + normalizedSelector`. The normalizer collapses dynamic IDs, `:nth-child(N)` indices, and Vue scoped attributes so equivalent DOM structures group together.

### Severity Levels

Violations are classified into four severity levels based on axe-core impact and how widespread the issue is:

| Severity | Meaning | Jira Priority |
|----------|---------|---------------|
| **Critical** | Blocks access for some users. Fix immediately. | Highest |
| **Significant** | Major barrier. High priority fix. | High |
| **Moderate** | Causes difficulty but has workarounds. | Medium |
| **Recommendation** | Minor issue or best practice. | Low |

Widespread violations (10+ affected pages) are automatically bumped up one severity level.

### Report Formats

- **HTML** (`audit-report.html`): Open in a browser. Sortable table, severity badges, WCAG criteria tags, top selectors. Self-contained with inline CSS.
- **JSON** (`audit-report.json`): Full enriched data including WCAG criterion details, severity mappings, component tier info. Good for programmatic consumption.
- **CSV** (`jira-import.csv`): One row per violation group. Columns: Summary, Description, Priority, Labels, Issue Type. Import into Jira via CSV importer.
- **LLM** (`llm-report.json`): Stripped-down JSON with only key facts. Feed this to an LLM for analysis, prioritization advice, or fix suggestions.

## Adding Custom Interaction Triggers

Interaction triggers click, hover, or focus elements before scanning to reveal dynamic content (modals, dropdowns, etc.) that axe-core would otherwise miss.

```ts
// audit.config.ts
interactionTriggers: [
  {
    name: 'Open search overlay',
    selector: '[data-testid="search-trigger"]',
    action: 'click',
    waitFor: '.search-overlay',    // Optional: wait for this element to appear
  },
  {
    name: 'Expand FAQ items',
    selector: '.faq-question',
    action: 'click',
    // No waitFor — just click and proceed
  },
  {
    name: 'Hover user menu',
    selector: '.user-avatar',
    action: 'hover',
    waitFor: '.user-dropdown',
  },
],
```

Each trigger:
- Finds all matching elements on the page
- Interacts with up to 3 visible elements (to avoid excessive clicking)
- Waits for the `waitFor` selector if provided (2s timeout)
- Continues to the next trigger even if one fails

The built-in triggers cover: modal dialogs, dropdown menus, accordions, tabs, tooltips, and mobile navigation toggles. Set `enableDefaultTriggers: false` to disable them.

## Tips

- **Scan your dev server, not production.** Dev mode provides better source maps, and if you enable Vue component resolution, it only works in dev mode.
- **Use `maxPages` for test runs.** Set `maxPages: 5` to quickly verify your config works before running a full audit.
- **Increase `maxConcurrentPages` carefully.** More parallelism = faster scans, but each tab uses ~100-200MB of memory.
- **Exclude third-party widgets** with `excludeSelectors` if they generate noise you can't fix (e.g., embedded chat widgets, ad iframes).
- **Run regularly.** Add `npm run audit` to your CI pipeline or run it before each release to catch regressions.
- **Feed `llm-report.json` to an LLM** for prioritization advice: "Given these WCAG violations, which should we fix first and what's the estimated effort?"
