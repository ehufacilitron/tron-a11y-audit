import type {
  PageScanResult,
  AuditMetadata,
  AggregatedResults,
  ViolationGroup,
  ViolationOccurrence,
} from '../types/audit-results.js';

/**
 * Aggregate page-level scan results into deduplicated violation groups.
 *
 * Deduplication key: ruleId + normalizedSelector
 * The same violation appearing on 50 pages becomes 1 ViolationGroup with count: 50.
 */
export function aggregateResults(
  pageResults: PageScanResult[],
  metadata: AuditMetadata,
): AggregatedResults {
  const groupMap = new Map<string, ViolationGroup>();

  for (const page of pageResults) {
    for (const violation of page.violations) {
      for (const node of violation.nodes) {
        const selector = node.target?.join(' ') ?? '';
        const normalizedSelector = normalizeSelector(selector);
        const groupKey = `${violation.id}::${normalizedSelector}`;

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            ruleId: violation.id,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            impact: (violation.impact as ViolationGroup['impact']) ?? 'moderate',
            wcagTags: violation.tags.filter((t) => t.startsWith('wcag')),
            occurrences: [],
            count: 0,
            affectedPages: [],
          });
        }

        const group = groupMap.get(groupKey)!;

        const occurrence: ViolationOccurrence = {
          pageUrl: page.url,
          selector,
          html: node.html,
          failureSummary: node.failureSummary ?? '',
        };

        // Attach component info if available
        if (page.componentMap && selector) {
          const resolved = page.componentMap[selector];
          if (resolved) {
            occurrence.component = resolved.componentFile ?? undefined;
            occurrence.componentFile = resolved.componentFile ?? undefined;
            occurrence.pageFile = resolved.pageFile ?? undefined;
          }
        }

        group.occurrences.push(occurrence);
        group.count++;

        if (!group.affectedPages.includes(page.url)) {
          group.affectedPages.push(page.url);
        }
      }
    }
  }

  // Sort groups: critical first, then by count descending
  const severityOrder: Record<string, number> = {
    critical: 0,
    serious: 1,
    moderate: 2,
    minor: 3,
  };

  const violationGroups = Array.from(groupMap.values()).sort((a, b) => {
    const severityDiff = (severityOrder[a.impact] ?? 4) - (severityOrder[b.impact] ?? 4);
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });

  // Build summary
  const bySeverity: Record<string, number> = {};
  for (const group of violationGroups) {
    bySeverity[group.impact] = (bySeverity[group.impact] ?? 0) + group.count;
  }

  return {
    metadata,
    violationGroups,
    pageResults,
    summary: {
      totalPages: pageResults.length,
      totalViolations: violationGroups.reduce((sum, g) => sum + g.count, 0),
      totalUniqueRules: new Set(violationGroups.map((g) => g.ruleId)).size,
      bySeverity,
    },
  };
}

/**
 * Normalize a CSS selector to collapse dynamic parts so equivalent violations
 * group together across pages.
 *
 * - Strips :nth-child(N) variations
 * - Normalizes dynamic IDs (e.g., #component-1234 → #component-*)
 * - Removes Vue scoped attributes (data-v-XXXX)
 */
function normalizeSelector(selector: string): string {
  let normalized = selector;

  // Normalize :nth-child(N) → :nth-child(*)
  normalized = normalized.replace(/:nth-child\(\d+\)/g, ':nth-child(*)');

  // Normalize dynamic IDs: sequences ending in numbers or hex → *
  normalized = normalized.replace(/#([\w-]+?)[-_]?[0-9a-f]{4,}/gi, '#$1-*');

  // Remove Vue scoped data attributes
  normalized = normalized.replace(/\[data-v-[a-f0-9]+\]/g, '');

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}
