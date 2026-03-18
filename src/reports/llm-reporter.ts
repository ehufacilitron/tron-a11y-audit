import { writeFileSync } from 'fs';
import type { EnrichedReport } from '../types/report-types.js';
import type { LlmReport, LlmViolation } from '../types/report-types.js';

/**
 * Generate a condensed JSON report optimized for LLM consumption.
 *
 * This strips verbose HTML snippets and long selector lists,
 * keeping only the key facts an LLM needs to understand and
 * reason about the violations.
 */
export function writeLlmReport(report: EnrichedReport, outputPath: string): void {
  const { metadata, summary, violationGroups } = report;

  const violations: LlmViolation[] = violationGroups.map((group) => {
    // Deduplicate selectors and keep only the top few
    const uniqueSelectors = [...new Set(group.occurrences.map((o) => o.selector))];
    const topSelectors = uniqueSelectors.slice(0, 3);

    const wcag = group.wcagCriteria.map((c) => `${c.id} ${c.name}`);

    // Use the first occurrence's failure summary as fix guidance
    const fix = group.occurrences[0]?.failureSummary ?? '';

    return {
      rule: group.ruleId,
      impact: group.impact,
      severity: group.severity.severity,
      wcag,
      description: group.help,
      count: group.count,
      pages: group.affectedPages.length,
      topSelectors,
      fix: cleanFixText(fix),
    };
  });

  const llmReport: LlmReport = {
    auditDate: metadata.auditDate,
    baseUrl: metadata.baseUrl,
    totalPages: summary.totalPages,
    totalViolations: summary.totalViolations,
    uniqueRules: summary.totalUniqueRules,
    severityBreakdown: summary.bySeverity,
    violations,
  };

  writeFileSync(outputPath, JSON.stringify(llmReport, null, 2));
}

/**
 * Clean up axe failure summary text for LLM consumption.
 * Remove "Fix any of the following:" / "Fix all of the following:" prefixes
 * and normalize whitespace.
 */
function cleanFixText(text: string): string {
  return text
    .replace(/Fix (any|all) of the following:\s*/gi, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}
