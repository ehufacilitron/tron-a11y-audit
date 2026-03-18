import { chromium, type Browser, type BrowserContext } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import config from '../../audit.config.js';
import { discoverUrls } from './sitemap-crawler.js';
import { scanPage } from './page-scanner.js';
import { aggregateResults } from '../analysis/results-aggregator.js';
import type { PageScanResult, AggregatedResults, AuditMetadata } from '../types/audit-results.js';

const RAW_DIR = join(config.outputDir, 'raw');
const AGGREGATED_DIR = join(config.outputDir, 'aggregated');

async function main() {
  const auditStart = Date.now();
  console.log('='.repeat(60));
  console.log('WCAG Accessibility Audit');
  console.log(`Target: ${config.baseUrl}`);
  console.log(`Level: WCAG 2.1 ${config.wcagLevel}`);
  console.log('='.repeat(60));

  // Ensure output directories exist
  for (const dir of [RAW_DIR, AGGREGATED_DIR]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  // 1. Discover URLs
  console.log('\n[1/4] Discovering URLs from sitemaps...');
  let urls = await discoverUrls(config);
  const totalDiscovered = urls.length;

  if (config.maxPages > 0) {
    console.log(`[scan] Limiting to ${config.maxPages} pages (of ${urls.length} discovered)`);
    urls = urls.slice(0, config.maxPages);
  }

  // 2. Launch browser
  console.log('\n[2/4] Launching browser...');
  const browser: Browser = await chromium.launch({ headless: true });

  // 3. Scan pages in batches
  console.log(`\n[3/4] Scanning ${urls.length} page(s) (concurrency: ${config.maxConcurrentPages})...\n`);
  const allResults: PageScanResult[] = [];
  let scanned = 0;

  for (let i = 0; i < urls.length; i += config.maxConcurrentPages) {
    const batch = urls.slice(i, i + config.maxConcurrentPages);

    const batchPromises = batch.map(async (url) => {
      const context: BrowserContext = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
      });
      const page = await context.newPage();

      try {
        const result = await scanPage(page, url, config);
        scanned++;
        const violationCount = result.violations.length;
        const status = violationCount > 0 ? `${violationCount} violation(s)` : 'PASS';
        console.log(`  [${scanned}/${urls.length}] ${status} — ${truncateUrl(url)}`);

        // Write raw result
        const filename = urlToFilename(url);
        writeFileSync(
          join(RAW_DIR, `${filename}.json`),
          JSON.stringify(result, null, 2),
        );

        return result;
      } catch (err) {
        console.error(`  [${scanned + 1}/${urls.length}] ERROR — ${url}: ${(err as Error).message}`);
        scanned++;
        return null;
      } finally {
        await context.close();
      }
    });

    const results = await Promise.all(batchPromises);
    allResults.push(...results.filter((r): r is PageScanResult => r !== null));
  }

  await browser.close();

  // 4. Aggregate results
  console.log('\n[4/4] Aggregating results...');
  const auditDuration = Date.now() - auditStart;

  const metadata: AuditMetadata = {
    auditDate: new Date().toISOString(),
    wcagLevel: config.wcagLevel,
    baseUrl: config.baseUrl,
    totalPagesScanned: allResults.length,
    totalPagesDiscovered: totalDiscovered,
    scanDuration: auditDuration,
  };

  const aggregated: AggregatedResults = aggregateResults(allResults, metadata);

  // Write aggregated results
  const aggregatedPath = join(AGGREGATED_DIR, 'aggregated-results.json');
  writeFileSync(aggregatedPath, JSON.stringify(aggregated, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Pages scanned:      ${aggregated.summary.totalPages}`);
  console.log(`Total violations:   ${aggregated.summary.totalViolations}`);
  console.log(`Unique rules:       ${aggregated.summary.totalUniqueRules}`);
  console.log(`Duration:           ${(auditDuration / 1000).toFixed(1)}s`);
  console.log('');
  console.log('Severity breakdown:');
  for (const [severity, count] of Object.entries(aggregated.summary.bySeverity)) {
    console.log(`  ${severity}: ${count}`);
  }
  console.log('');
  console.log(`Raw results:        ${RAW_DIR}/`);
  console.log(`Aggregated results: ${aggregatedPath}`);
  console.log('');
  console.log('Run `npm run report` to generate HTML, CSV, and JSON reports.');
}

function urlToFilename(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'index';
    return path.substring(0, 200);
  } catch {
    return 'unknown';
  }
}

function truncateUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    return path.length > 60 ? path.substring(0, 57) + '...' : path;
  } catch {
    return url;
  }
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
