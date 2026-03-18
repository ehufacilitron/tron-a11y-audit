import { writeFileSync } from 'fs';
import type { EnrichedReport } from '../types/report-types.js';

/**
 * Write the full enriched report as formatted JSON.
 */
export function writeJsonReport(report: EnrichedReport, outputPath: string): void {
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
}
