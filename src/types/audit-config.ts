export interface InteractionTrigger {
  name: string;
  selector: string;
  action: 'click' | 'hover' | 'focus';
  waitFor?: string;
}

export interface ComponentPattern {
  selector: string;
  name: string;
  tier: 'base' | 'display' | 'section' | 'page' | 'unknown';
}

export interface AuditConfig {
  baseUrl: string;

  sitemapIndexPath: string;
  sitemapPaths: string[];

  maxConcurrentPages: number;
  pageTimeout: number;
  hydrationTimeout: number;
  maxPages: number;

  wcagLevel: 'A' | 'AA' | 'AAA';
  excludeSelectors: string[];

  interactionTriggers: InteractionTrigger[];
  enableDefaultTriggers: boolean;

  enableComponentResolution: boolean;
  projectRoot: string;

  componentPatterns: ComponentPattern[];

  outputDir: string;
}
