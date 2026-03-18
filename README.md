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

Reports group violations, not individual occurrences. If the same color-contrast violation appears on 50 pages, you get **1 violation group** with `count: 50` and a list of all 50 affected URLs — not 50 separate entries. This keeps reports focused on distinct issues rather than repeating the same problem for every page.

Two violations are considered "the same" when they share the same axe-core rule ID and a normalized CSS selector. The normalizer collapses things that look different but are structurally identical: dynamic IDs (e.g., `#component-1234` becomes `#component-*`), `:nth-child(N)` indices, and Vue scoped attributes (`[data-v-xxxxx]`). This means a button with `id="btn-7"` on one page and `id="btn-42"` on another will group together as the same violation.

### Severity Levels

axe-core reports a raw **impact** for each violation (critical, serious, moderate, minor). The tool maps this to a project **severity** level that also factors in how widespread the issue is:

| axe-core Impact | Default Severity | Jira Priority | Bumped Severity (10+ pages) |
|-----------------|-----------------|---------------|----------------------------|
| critical | **Critical** | Highest | Critical (no change) |
| serious | **Significant** | High | **Critical** (Highest) |
| moderate | **Moderate** | Medium | **Significant** (High) |
| minor | **Recommendation** | Low | Recommendation (no change) |

The idea: a "serious" violation that only appears on 1 page is Significant, but the same violation appearing on 10+ pages gets bumped to Critical because the breadth of impact makes it a higher priority to fix. Both the raw impact and the mapped severity appear in all reports so you can see both.

### Report Formats

Four reports are generated, each designed for a different audience or workflow.

#### HTML Report (`audit-report.html`)

Open this in a browser. It's a self-contained file (all CSS and JavaScript inline, no external dependencies) with:

- **Summary cards** at the top showing pages scanned, total violations, unique rules, and a severity breakdown with color-coded badges.
- **Sortable violations table** — click any column header (Severity, Impact, Rule, Count, Pages) to sort. Each row shows:
  - **Severity badge** (Critical = red, Significant = orange, Moderate = gold, Recommendation = blue)
  - **Impact badge** (the raw axe-core impact: critical, serious, moderate, minor)
  - **Rule ID** with a "Learn more" link to the axe-core documentation for that rule
  - **Description** of what the rule checks
  - **WCAG criteria tags** — clickable blue pills showing which WCAG success criteria the violation maps to (e.g., "1.4.3 Contrast (Minimum)"). If a rule doesn't map to a specific criterion, it shows "best-practice".
  - **Count** — total number of times this violation was found across the site
  - **Pages** — how many distinct pages are affected
  - **Top selector** — the CSS selector identifying the offending element. If there are multiple unique selectors for the same rule, you can expand a "N unique selectors" dropdown to see up to 5 of them.

This is the best report for getting a quick visual overview and for sharing with stakeholders who want to see the big picture.

#### JSON Report (`audit-report.json`)

The full enriched dataset as formatted JSON. Contains everything the HTML report shows, plus additional detail:

- **Metadata**: audit date, WCAG level, base URL, pages scanned vs. discovered, scan duration, report generation timestamp.
- **Violation groups**: each group includes the rule ID, description, help text, axe-core documentation URL, impact level, mapped WCAG criteria (with criterion ID, name, level, and W3C Understanding URL), severity classification with Jira priority mapping, optional component tier info, every individual occurrence (page URL, CSS selector, raw HTML snippet, failure summary, and Vue component info if enabled), total count, and list of all affected page URLs.
- **Summary**: totals for pages, violations, unique rules, counts broken down by severity, and counts broken down by WCAG criterion.

Use this for programmatic consumption — feeding into dashboards, diffing between audits, or building custom views.

#### CSV Report (`jira-import.csv`)

One row per violation group, formatted for Jira's CSV importer. Five columns:

| Column | Content |
|--------|---------|
| **Summary** | `[a11y] {description} ({ruleId})` |
| **Description** | Jira-formatted text (see below) |
| **Priority** | Highest, High, Medium, or Low (maps from severity) |
| **Labels** | `accessibility wcag-aa a11y-{impact} {ruleId}` |
| **Issue Type** | Bug |

The Description field is rich — it includes impact, severity, WCAG level, WCAG criteria (e.g., "SC 1.4.3 Contrast (Minimum) (Level AA)"), a full description of the rule, occurrence count and page count, up to 5 affected CSS selectors, up to 5 affected page URLs, fix guidance pulled from axe-core's failure summary, and a reference link to the rule documentation. All formatted with Jira wiki markup (`*bold*` labels).

To import: Jira > Projects > Import Issues > CSV. Map the columns to Jira fields. The labels column is space-separated so Jira will create individual labels for filtering.

#### LLM Report (`llm-report.json`)

A condensed JSON format designed to fit efficiently in an LLM's context window. It strips out verbose HTML snippets, long selector lists, and redundant detail, keeping only what an LLM needs to reason about the violations:

- **Top-level**: audit date, base URL, total pages, total violations, unique rules, and a severity breakdown object.
- **Per violation**: rule ID, impact, severity, WCAG criteria (formatted as "1.1.1 Non-text Content"), description, count, number of affected pages, up to 3 representative CSS selectors, and cleaned fix guidance (axe-core's "Fix any/all of the following:" prefix is stripped, whitespace normalized).

Feed this to an LLM with a prompt like: "Given these WCAG violations, which should we fix first and what's the estimated effort?" or "Generate a sprint plan to address the critical and significant issues."

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

## Important: This Tool Is Not Enough on Its Own

Automated scanning catches a lot, but it cannot catch everything. axe-core (the engine behind this tool) typically identifies [30–40% of WCAG issues](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/). The rest require human judgment — things like whether focus order makes sense, whether content is understandable, whether custom interactions work with assistive technology, or whether alt text is actually meaningful (not just present).

**Use this tool as a starting point, not a finish line.** A clean automated report does not mean your site is accessible.

### Recommended Additional Testing

**Browser extensions** — install and use these alongside automated scans:

- **[WAVE](https://wave.webaim.org/extension/)** — WebAIM's browser extension. Gives you a visual overlay of accessibility issues directly on the page. Great for spotting structural problems (heading hierarchy, missing landmarks, empty links) that are easier to understand in context than in a table. Available for Chrome, Firefox, and Edge.
- **[Stark](https://www.getstark.co/)** — Browser extension with contrast checking, vision simulation (color blindness, low vision, blurred vision), focus order visualization, and more. Particularly useful for evaluating design and color choices that automated tools can flag but can't fully judge.

**Manual testing** — no tool replaces actually using the site the way your users do:

- **Keyboard-only navigation**: Unplug your mouse and tab through the entire page. Can you reach every interactive element? Can you tell where focus is? Can you operate menus, modals, and forms without a pointer? Can you escape back out of everything you open?
- **Screen reader testing**: Test with at least one screen reader (VoiceOver on macOS, NVDA on Windows). Listen to how the page reads. Do images have meaningful descriptions? Do form fields announce their labels? Do dynamic updates (toasts, loading states, error messages) get announced?
- **Zoom and reflow**: Zoom to 200% and 400%. Does content reflow into a single column without horizontal scrolling? Does anything get cut off or overlap?
- **Content review**: Read the page. Are link texts descriptive (not "click here")? Are error messages helpful? Is the reading order logical?

The automated scan gives you a prioritized list of concrete issues to fix. The browser extensions help you see and understand those issues in context. Manual testing catches the things no tool can — and builds the intuition your team needs to write accessible code going forward.

## Tips

- **Scan your dev server, not production.** Dev mode provides better source maps, and if you enable Vue component resolution, it only works in dev mode.
- **Use `maxPages` for test runs.** Set `maxPages: 5` to quickly verify your config works before running a full audit.
- **Increase `maxConcurrentPages` carefully.** More parallelism = faster scans, but each tab uses ~100-200MB of memory.
- **Exclude third-party widgets** with `excludeSelectors` if they generate noise you can't fix (e.g., embedded chat widgets, ad iframes).
- **Run regularly.** Add `npm run audit` to your CI pipeline or run it before each release to catch regressions.
- **Feed `llm-report.json` to an LLM** for prioritization advice: "Given these WCAG violations, which should we fix first and what's the estimated effort?"
