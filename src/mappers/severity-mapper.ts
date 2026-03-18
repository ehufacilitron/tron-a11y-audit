import type { SeverityMapping } from '../types/report-types.js';

/**
 * Map axe-core impact level + context (WCAG level, affected page count)
 * to a project severity for prioritization and Jira import.
 *
 * Matrix:
 *   critical impact  → Critical
 *   serious impact   → Significant (or Critical if 10+ pages)
 *   moderate impact  → Moderate (or Significant if 10+ pages)
 *   minor impact     → Recommendation
 */
export function mapSeverity(
  impact: string,
  wcagLevel: string = 'AA',
  affectedPageCount: number = 1,
): SeverityMapping {
  // Boost severity if the violation is widespread
  const isWidespread = affectedPageCount >= 10;

  switch (impact) {
    case 'critical':
      return {
        severity: 'Critical',
        priority: 'Highest',
        jiraPriority: 'Highest',
      };

    case 'serious':
      if (isWidespread) {
        return {
          severity: 'Critical',
          priority: 'Highest',
          jiraPriority: 'Highest',
        };
      }
      return {
        severity: 'Significant',
        priority: 'High',
        jiraPriority: 'High',
      };

    case 'moderate':
      if (isWidespread) {
        return {
          severity: 'Significant',
          priority: 'High',
          jiraPriority: 'High',
        };
      }
      return {
        severity: 'Moderate',
        priority: 'Medium',
        jiraPriority: 'Medium',
      };

    case 'minor':
      return {
        severity: 'Recommendation',
        priority: 'Low',
        jiraPriority: 'Low',
      };

    default:
      return {
        severity: 'Moderate',
        priority: 'Medium',
        jiraPriority: 'Medium',
      };
  }
}

/**
 * Get a numeric sort value for severity (lower = more severe).
 */
export function severitySortOrder(severity: string): number {
  switch (severity) {
    case 'Critical': return 0;
    case 'Significant': return 1;
    case 'Moderate': return 2;
    case 'Recommendation': return 3;
    default: return 4;
  }
}
