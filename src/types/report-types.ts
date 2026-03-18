export interface WcagCriterion {
  id: string;
  name: string;
  level: 'A' | 'AA' | 'AAA';
  url: string;
}

export interface SeverityMapping {
  severity: 'Critical' | 'Significant' | 'Moderate' | 'Recommendation';
  priority: 'Highest' | 'High' | 'Medium' | 'Low';
  jiraPriority: string;
}

export interface ComponentTierInfo {
  name: string;
  tier: 'base' | 'display' | 'section' | 'page' | 'unknown';
}

export interface EnrichedViolationGroup {
  ruleId: string;
  description: string;
  help: string;
  helpUrl: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagCriteria: WcagCriterion[];
  severity: SeverityMapping;
  componentTier?: ComponentTierInfo;
  occurrences: EnrichedOccurrence[];
  count: number;
  affectedPages: string[];
}

export interface EnrichedOccurrence {
  pageUrl: string;
  selector: string;
  html: string;
  failureSummary: string;
  component?: string;
  componentFile?: string;
  pageFile?: string;
  componentTier?: ComponentTierInfo;
}

export interface EnrichedReport {
  metadata: {
    auditDate: string;
    wcagLevel: string;
    baseUrl: string;
    totalPagesScanned: number;
    totalPagesDiscovered: number;
    scanDuration: number;
    reportGeneratedAt: string;
  };
  violationGroups: EnrichedViolationGroup[];
  summary: {
    totalPages: number;
    totalViolations: number;
    totalUniqueRules: number;
    bySeverity: Record<string, number>;
    byWcagCriterion: Record<string, number>;
  };
}

export interface JiraCsvRow {
  Summary: string;
  Description: string;
  Priority: string;
  Labels: string;
  'Issue Type': string;
}

export interface LlmReport {
  auditDate: string;
  baseUrl: string;
  totalPages: number;
  totalViolations: number;
  uniqueRules: number;
  severityBreakdown: Record<string, number>;
  violations: LlmViolation[];
}

export interface LlmViolation {
  rule: string;
  impact: string;
  severity: string;
  wcag: string[];
  description: string;
  count: number;
  pages: number;
  topSelectors: string[];
  fix: string;
}
