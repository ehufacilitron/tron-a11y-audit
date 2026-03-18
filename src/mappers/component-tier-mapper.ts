import type { ComponentPattern } from '../types/audit-config.js';
import type { ComponentTierInfo } from '../types/report-types.js';

/**
 * Map a CSS selector or component file path to a component tier.
 *
 * Uses configurable patterns from audit.config.ts.
 * Falls back to file path heuristics if component resolution is available.
 */
export function mapComponentTier(
  selector: string,
  patterns: ComponentPattern[],
  componentFile?: string,
): ComponentTierInfo | undefined {
  // First, try matching against user-defined patterns
  for (const pattern of patterns) {
    const patternSelectors = pattern.selector.split(',').map((s) => s.trim());
    for (const pat of patternSelectors) {
      if (matchesSelectorPattern(selector, pat)) {
        return { name: pattern.name, tier: pattern.tier };
      }
    }
  }

  // If we have a component file path, infer tier from directory structure
  if (componentFile) {
    return inferTierFromFilePath(componentFile);
  }

  return undefined;
}

/**
 * Simple selector pattern matching.
 * Supports: exact match, class prefix (`.card-*`), tag match.
 */
function matchesSelectorPattern(selector: string, pattern: string): boolean {
  // Wildcard suffix: `.card-*` matches `.card-header`, `.card-body`, etc.
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return selector.includes(prefix);
  }

  // Exact class/tag/id presence in the selector
  return selector.includes(pattern);
}

/**
 * Infer component tier from file path conventions.
 * Common patterns: components/base/, components/display/, components/section/, pages/
 */
function inferTierFromFilePath(filePath: string): ComponentTierInfo | undefined {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();

  if (normalized.includes('/base/') || normalized.includes('/atoms/') || normalized.includes('/primitives/')) {
    const name = extractComponentName(filePath);
    return { name, tier: 'base' };
  }

  if (normalized.includes('/display/') || normalized.includes('/molecules/') || normalized.includes('/containers/')) {
    const name = extractComponentName(filePath);
    return { name, tier: 'display' };
  }

  if (normalized.includes('/section/') || normalized.includes('/organisms/') || normalized.includes('/sections/')) {
    const name = extractComponentName(filePath);
    return { name, tier: 'section' };
  }

  if (normalized.includes('/pages/') || normalized.includes('/views/')) {
    const name = extractComponentName(filePath);
    return { name, tier: 'page' };
  }

  return undefined;
}

function extractComponentName(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const filename = parts[parts.length - 1] ?? 'Unknown';
  return filename.replace(/\.(vue|tsx|jsx|ts|js)$/, '');
}
