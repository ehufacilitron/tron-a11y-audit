import { writeFileSync } from 'fs';
import type { EnrichedReport, EnrichedViolationGroup } from '../types/report-types.js';

/**
 * Generate a Jira-importable CSV file.
 *
 * Columns: Summary, Description, Priority, Labels, Issue Type
 * Each violation group becomes one Jira issue.
 */
export function writeCsvReport(report: EnrichedReport, outputPath: string): void {
  const headers = ['Summary', 'Description', 'Priority', 'Labels', 'Issue Type'];
  const rows = report.violationGroups.map((group) => buildRow(group, report.metadata.wcagLevel));

  const csvContent = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\n');

  writeFileSync(outputPath, csvContent);
}

function buildRow(group: EnrichedViolationGroup, wcagLevel: string): string[] {
  const summary = `[a11y] ${group.help} (${group.ruleId})`;

  const wcagCriteria = group.wcagCriteria
    .map((c) => `SC ${c.id} ${c.name} (Level ${c.level})`)
    .join(', ');

  const topSelectors = [...new Set(group.occurrences.map((o) => o.selector))]
    .slice(0, 5)
    .map((s) => `- ${s}`)
    .join('\n');

  const topPages = group.affectedPages
    .slice(0, 5)
    .map((p) => `- ${p}`)
    .join('\n');

  const description = [
    `*Impact:* ${group.impact}`,
    `*Severity:* ${group.severity.severity}`,
    `*WCAG Level:* ${wcagLevel}`,
    wcagCriteria ? `*WCAG Criteria:* ${wcagCriteria}` : '',
    '',
    `*Description:*`,
    group.description,
    '',
    `*Occurrences:* ${group.count} across ${group.affectedPages.length} page(s)`,
    '',
    `*Affected Selectors:*`,
    topSelectors,
    group.occurrences.length > 5 ? `- ... and ${group.occurrences.length - 5} more` : '',
    '',
    `*Affected Pages:*`,
    topPages,
    group.affectedPages.length > 5 ? `- ... and ${group.affectedPages.length - 5} more` : '',
    '',
    `*Fix guidance:*`,
    group.occurrences[0]?.failureSummary ?? 'See axe-core documentation.',
    '',
    `*Reference:* ${group.helpUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const labels = [
    'accessibility',
    `wcag-${wcagLevel.toLowerCase()}`,
    `a11y-${group.impact}`,
    group.ruleId,
  ].join(' ');

  const priority = group.severity.jiraPriority;

  return [summary, description, priority, labels, 'Bug'];
}

function escapeCsvField(field: string): string {
  // If the field contains commas, newlines, or quotes, wrap in quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
