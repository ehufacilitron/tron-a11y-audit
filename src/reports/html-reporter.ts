import { writeFileSync } from 'fs';
import type { EnrichedReport, EnrichedViolationGroup } from '../types/report-types.js';

/**
 * Generate a standalone HTML report with inline CSS.
 * Includes summary stats, severity breakdown, and a sortable violations table.
 */
export function writeHtmlReport(report: EnrichedReport, outputPath: string): void {
  const html = buildHtml(report);
  writeFileSync(outputPath, html);
}

function buildHtml(report: EnrichedReport): string {
  const { metadata, summary, violationGroups } = report;

  const severityColors: Record<string, string> = {
    Critical: '#dc2626',
    Significant: '#ea580c',
    Moderate: '#ca8a04',
    Recommendation: '#2563eb',
  };

  const impactColors: Record<string, string> = {
    critical: '#dc2626',
    serious: '#ea580c',
    moderate: '#ca8a04',
    minor: '#6b7280',
  };

  const severityBadges = Object.entries(summary.bySeverity)
    .map(([sev, count]) => {
      const color = impactColors[sev] ?? '#6b7280';
      return `<span class="badge" style="background:${color}">${sev}: ${count}</span>`;
    })
    .join(' ');

  const violationRows = violationGroups
    .map((group) => buildViolationRow(group, severityColors, impactColors))
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WCAG Accessibility Audit Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 1400px; margin: 0 auto; padding: 2rem; background: #f9fafb; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h3 { font-size: 1rem; margin: 1rem 0 0.5rem; }
    .meta { color: #6b7280; margin-bottom: 1.5rem; }
    .meta span { margin-right: 1.5rem; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-card .label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card .value { font-size: 1.75rem; font-weight: 700; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; color: white; font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th { background: #f3f4f6; text-align: left; padding: 0.75rem 1rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; cursor: pointer; user-select: none; white-space: nowrap; }
    th:hover { background: #e5e7eb; }
    td { padding: 0.75rem 1rem; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 0.9rem; }
    tr:hover td { background: #f9fafb; }
    .impact-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; color: white; font-size: 0.75rem; font-weight: 600; }
    .severity-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; color: white; font-size: 0.75rem; font-weight: 600; }
    .wcag-tag { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 4px; background: #dbeafe; color: #1e40af; font-size: 0.7rem; font-weight: 500; margin: 0.1rem; }
    .help-link { color: #2563eb; text-decoration: none; font-size: 0.8rem; }
    .help-link:hover { text-decoration: underline; }
    .selector { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.75rem; color: #6b7280; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .count { font-weight: 700; font-size: 1.1rem; }
    .pages { font-size: 0.8rem; color: #6b7280; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 0.8rem; }
    details { margin-top: 0.25rem; }
    details summary { cursor: pointer; font-size: 0.8rem; color: #2563eb; }
    details .occurrence-list { padding: 0.5rem; background: #f9fafb; border-radius: 4px; margin-top: 0.25rem; }
    details .occurrence-list li { font-size: 0.75rem; margin-bottom: 0.25rem; font-family: monospace; word-break: break-all; }
  </style>
</head>
<body>
  <h1>WCAG Accessibility Audit Report</h1>
  <div class="meta">
    <span>URL: ${escHtml(metadata.baseUrl)}</span>
    <span>Level: WCAG 2.1 ${escHtml(metadata.wcagLevel)}</span>
    <span>Date: ${new Date(metadata.auditDate).toLocaleDateString()}</span>
    <span>Duration: ${(metadata.scanDuration / 1000).toFixed(1)}s</span>
  </div>

  <div class="summary-grid">
    <div class="stat-card">
      <div class="label">Pages Scanned</div>
      <div class="value">${summary.totalPages}</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Violations</div>
      <div class="value">${summary.totalViolations}</div>
    </div>
    <div class="stat-card">
      <div class="label">Unique Rules</div>
      <div class="value">${summary.totalUniqueRules}</div>
    </div>
    <div class="stat-card">
      <div class="label">Severity</div>
      <div>${severityBadges}</div>
    </div>
  </div>

  <h2>Violations (${violationGroups.length} groups)</h2>
  <table id="violations-table">
    <thead>
      <tr>
        <th data-sort="severity">Severity</th>
        <th data-sort="impact">Impact</th>
        <th data-sort="rule">Rule</th>
        <th>Description</th>
        <th>WCAG</th>
        <th data-sort="count">Count</th>
        <th data-sort="pages">Pages</th>
        <th>Top Selector</th>
      </tr>
    </thead>
    <tbody>
      ${violationRows}
    </tbody>
  </table>

  <div class="footer">
    Generated ${new Date(metadata.reportGeneratedAt).toLocaleString()} by tron-a11y-audit
  </div>

  <script>
    // Simple client-side column sorting
    document.querySelectorAll('#violations-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const table = document.getElementById('violations-table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const col = th.cellIndex;
        const asc = th.dataset.dir !== 'asc';
        th.dataset.dir = asc ? 'asc' : 'desc';
        rows.sort((a, b) => {
          const av = a.cells[col].dataset.value || a.cells[col].textContent;
          const bv = b.cells[col].dataset.value || b.cells[col].textContent;
          const an = Number(av), bn = Number(bv);
          if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
          return asc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        rows.forEach(r => tbody.appendChild(r));
      });
    });
  </script>
</body>
</html>`;
}

function buildViolationRow(
  group: EnrichedViolationGroup,
  severityColors: Record<string, string>,
  impactColors: Record<string, string>,
): string {
  const sevColor = severityColors[group.severity.severity] ?? '#6b7280';
  const impColor = impactColors[group.impact] ?? '#6b7280';

  const wcagTags = group.wcagCriteria
    .map((c) => `<span class="wcag-tag">${escHtml(c.id)} ${escHtml(c.name)}</span>`)
    .join(' ');

  const topSelector = group.occurrences[0]?.selector ?? '';

  // Build occurrence details
  const uniqueSelectors = [...new Set(group.occurrences.map((o) => o.selector))].slice(0, 5);
  const selectorList = uniqueSelectors
    .map((s) => `<li>${escHtml(s)}</li>`)
    .join('');

  const sevOrder = { Critical: 0, Significant: 1, Moderate: 2, Recommendation: 3 };
  const sevSortVal = sevOrder[group.severity.severity as keyof typeof sevOrder] ?? 4;

  return `<tr>
    <td data-value="${sevSortVal}"><span class="severity-badge" style="background:${sevColor}">${escHtml(group.severity.severity)}</span></td>
    <td><span class="impact-badge" style="background:${impColor}">${escHtml(group.impact)}</span></td>
    <td data-value="${escHtml(group.ruleId)}">${escHtml(group.ruleId)}<br><a class="help-link" href="${escHtml(group.helpUrl)}" target="_blank">Learn more</a></td>
    <td>${escHtml(group.help)}</td>
    <td>${wcagTags || '<span class="wcag-tag">best-practice</span>'}</td>
    <td data-value="${group.count}" class="count">${group.count}</td>
    <td data-value="${group.affectedPages.length}" class="pages">${group.affectedPages.length} page(s)</td>
    <td><div class="selector">${escHtml(topSelector)}</div>
      ${uniqueSelectors.length > 1 ? `<details><summary>${uniqueSelectors.length} unique selectors</summary><ul class="occurrence-list">${selectorList}</ul></details>` : ''}
    </td>
  </tr>`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
