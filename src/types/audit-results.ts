import type { Result } from 'axe-core';

export interface ResolvedComponent {
  componentFile: string | null;
  pageFile: string | null;
}

export interface PageScanResult {
  url: string;
  timestamp: string;
  violations: Result[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  scanDuration: number;
  componentMap?: Record<string, ResolvedComponent>;
}

export interface ViolationOccurrence {
  pageUrl: string;
  selector: string;
  html: string;
  failureSummary: string;
  component?: string;
  componentFile?: string;
  pageFile?: string;
}

export interface ViolationGroup {
  ruleId: string;
  description: string;
  help: string;
  helpUrl: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagTags: string[];
  occurrences: ViolationOccurrence[];
  count: number;
  affectedPages: string[];
}

export interface AuditMetadata {
  auditDate: string;
  wcagLevel: string;
  baseUrl: string;
  totalPagesScanned: number;
  totalPagesDiscovered: number;
  scanDuration: number;
}

export interface AggregatedResults {
  metadata: AuditMetadata;
  violationGroups: ViolationGroup[];
  pageResults: PageScanResult[];
  summary: {
    totalPages: number;
    totalViolations: number;
    totalUniqueRules: number;
    bySeverity: Record<string, number>;
  };
}
