import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import config from '../../audit.config.js';
import type { AggregatedResults } from '../types/audit-results.js';
import type { EnrichedReport, EnrichedViolationGroup, EnrichedOccurrence } from '../types/report-types.js';
import { mapWcagTags } from '../mappers/wcag-mapper.js';
import { mapSeverity } from '../mappers/severity-mapper.js';
import { mapComponentTier } from '../mappers/component-tier-mapper.js';
import { writeJsonReport } from './json-reporter.js';
import { writeHtmlReport } from './html-reporter.js';
import { writeCsvReport } from './csv-reporter.js';
import { writeLlmReport } from './llm-reporter.js';

const AGGREGATED_PATH = join(config.outputDir, 'aggregated', 'aggregated-results.json');
const REPORTS_DIR = join(config.outputDir, 'reports');

async function main() {
  console.log('='.repeat(60));
  console.log('Generating Reports');
  console.log('='.repeat(60));

  // Load aggregated results
  if (!existsSync(AGGREGATED_PATH)) {
    console.error(`No aggregated results found at ${AGGREGATED_PATH}`);
    console.error('Run `npm run scan` first.');
    process.exit(1);
  }

  const raw = readFileSync(AGGREGATED_PATH, 'utf-8');
  const aggregated: AggregatedResults = JSON.parse(raw);

  console.log(`Loaded ${aggregated.summary.totalViolations} violations across ${aggregated.summary.totalPages} pages`);

  // Enrich with WCAG mappings, severity, and component tiers
  const enriched = enrichResults(aggregated);

  // Ensure reports directory exists
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // Generate all report formats
  const jsonPath = join(REPORTS_DIR, 'audit-report.json');
  const htmlPath = join(REPORTS_DIR, 'audit-report.html');
  const csvPath = join(REPORTS_DIR, 'jira-import.csv');
  const llmPath = join(REPORTS_DIR, 'llm-report.json');

  writeJsonReport(enriched, jsonPath);
  console.log(`  JSON report: ${jsonPath}`);

  writeHtmlReport(enriched, htmlPath);
  console.log(`  HTML report: ${htmlPath}`);

  writeCsvReport(enriched, csvPath);
  console.log(`  CSV report:  ${csvPath}`);

  writeLlmReport(enriched, llmPath);
  console.log(`  LLM report:  ${llmPath}`);

  console.log('\nDone.');
}

function enrichResults(aggregated: AggregatedResults): EnrichedReport {
  const byWcagCriterion: Record<string, number> = {};

  const violationGroups: EnrichedViolationGroup[] = aggregated.violationGroups.map((group) => {
    const wcagCriteria = mapWcagTags(group.wcagTags);
    const severity = mapSeverity(group.impact, aggregated.metadata.wcagLevel, group.affectedPages.length);

    // Track WCAG criterion counts
    for (const criterion of wcagCriteria) {
      byWcagCriterion[criterion.id] = (byWcagCriterion[criterion.id] ?? 0) + group.count;
    }

    const enrichedOccurrences: EnrichedOccurrence[] = group.occurrences.map((occ) => {
      const componentTier = mapComponentTier(
        occ.selector,
        config.componentPatterns,
        occ.componentFile ?? undefined,
      );

      return {
        ...occ,
        componentTier,
      };
    });

    // Determine the most common component tier for the group
    const tierCounts = new Map<string, number>();
    for (const occ of enrichedOccurrences) {
      if (occ.componentTier) {
        const key = `${occ.componentTier.name}:${occ.componentTier.tier}`;
        tierCounts.set(key, (tierCounts.get(key) ?? 0) + 1);
      }
    }
    let groupTier = undefined;
    if (tierCounts.size > 0) {
      const [topKey] = [...tierCounts.entries()].sort((a, b) => b[1] - a[1])[0];
      const [name, tier] = topKey.split(':');
      groupTier = { name, tier: tier as EnrichedViolationGroup['componentTier'] extends undefined ? never : NonNullable<EnrichedViolationGroup['componentTier']>['tier'] };
    }

    return {
      ruleId: group.ruleId,
      description: group.description,
      help: group.help,
      helpUrl: group.helpUrl,
      impact: group.impact,
      wcagCriteria,
      severity,
      componentTier: groupTier,
      occurrences: enrichedOccurrences,
      count: group.count,
      affectedPages: group.affectedPages,
    };
  });

  return {
    metadata: {
      ...aggregated.metadata,
      reportGeneratedAt: new Date().toISOString(),
    },
    violationGroups,
    summary: {
      ...aggregated.summary,
      byWcagCriterion,
    },
  };
}

main().catch((err) => {
  console.error('Report generation failed:', err);
  process.exit(1);
});
