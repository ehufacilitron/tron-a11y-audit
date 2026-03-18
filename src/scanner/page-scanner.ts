import type { Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';
import type { AuditConfig } from '../types/audit-config.js';
import type { PageScanResult, ResolvedComponent } from '../types/audit-results.js';
import { runInteractionTriggers } from './interaction-triggers.js';
import { resolveVueComponents } from '../analysis/component-resolver.js';

/**
 * Scan a single page for WCAG violations using axe-core.
 *
 * Pipeline:
 * 1. Navigate to URL
 * 2. Wait for SPA hydration
 * 3. Wait for network idle
 * 4. Run interaction triggers to reveal dynamic content
 * 5. Run axe-core scan
 * 6. Promote incomplete color-contrast results to violations
 * 7. Optionally resolve Vue component sources
 */
export async function scanPage(page: Page, url: string, config: AuditConfig): Promise<PageScanResult> {
  const startTime = Date.now();

  // 1. Navigate
  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: config.pageTimeout,
    });
  } catch (err) {
    console.error(`[scanner] Navigation failed for ${url}: ${(err as Error).message}`);
    return createErrorResult(url, startTime);
  }

  // 2. Wait for hydration — look for signs the SPA has mounted
  try {
    await Promise.race([
      page.waitForSelector('[data-v-app], [data-server-rendered], #__nuxt, #__next, #app', {
        timeout: config.hydrationTimeout,
      }),
      page.waitForTimeout(config.hydrationTimeout),
    ]);
  } catch {
    // Hydration detection is best-effort
  }

  // 3. Wait for network to settle
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // Network idle timeout is acceptable — proceed with scan
  }

  // 4. Run interaction triggers
  const triggerResults = await runInteractionTriggers(
    page,
    config.interactionTriggers,
    config.enableDefaultTriggers,
  );

  const triggeredCount = triggerResults.filter((r) => r.status === 'triggered').length;
  if (triggeredCount > 0) {
    console.log(`[scanner]   Triggers: ${triggeredCount} activated`);
  }

  // 5. Run axe-core
  let violations: Result[] = [];
  let passes = 0;
  let incomplete = 0;
  let inapplicable = 0;

  try {
    const wcagTags = getWcagTags(config.wcagLevel);

    let builder = new AxeBuilder({ page })
      .withTags(wcagTags);

    if (config.excludeSelectors.length > 0) {
      for (const selector of config.excludeSelectors) {
        builder = builder.exclude(selector);
      }
    }

    const results = await builder.analyze();

    violations = results.violations;
    passes = results.passes.length;
    incomplete = results.incomplete.length;
    inapplicable = results.inapplicable.length;

    // 6. Promote incomplete color-contrast to violations
    //    axe often marks color-contrast as "incomplete" when it can't determine
    //    the background. These are usually real violations worth reviewing.
    const colorContrastIncomplete = results.incomplete.filter(
      (r) => r.id === 'color-contrast',
    );
    if (colorContrastIncomplete.length > 0) {
      violations.push(...colorContrastIncomplete);
      incomplete -= colorContrastIncomplete.length;
    }
  } catch (err) {
    console.error(`[scanner] axe-core failed for ${url}: ${(err as Error).message}`);
  }

  // 7. Optional Vue component resolution
  let componentMap: Record<string, ResolvedComponent> | undefined;
  if (config.enableComponentResolution) {
    try {
      componentMap = await resolveVueComponents(page);
    } catch {
      // Component resolution is best-effort
    }
  }

  const scanDuration = Date.now() - startTime;

  return {
    url,
    timestamp: new Date().toISOString(),
    violations,
    passes,
    incomplete,
    inapplicable,
    scanDuration,
    ...(componentMap ? { componentMap } : {}),
  };
}

function getWcagTags(level: string): string[] {
  switch (level) {
    case 'A':
      return ['wcag2a', 'wcag21a'];
    case 'AA':
      return ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
    case 'AAA':
      return ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa'];
    default:
      return ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
  }
}

function createErrorResult(url: string, startTime: number): PageScanResult {
  return {
    url,
    timestamp: new Date().toISOString(),
    violations: [],
    passes: 0,
    incomplete: 0,
    inapplicable: 0,
    scanDuration: Date.now() - startTime,
  };
}
