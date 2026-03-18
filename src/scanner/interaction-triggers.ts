import type { Page } from 'playwright';
import type { InteractionTrigger } from '../types/audit-config.js';

interface TriggerResult {
  name: string;
  status: 'triggered' | 'skipped' | 'error';
  message?: string;
}

/**
 * Built-in interaction triggers that exercise common dynamic UI patterns.
 * These try to open modals, expand dropdowns, toggle accordions, etc.
 * so axe-core can scan the revealed content.
 */
const DEFAULT_TRIGGERS: InteractionTrigger[] = [
  // Modals / Dialogs
  {
    name: 'Open modal dialogs',
    selector: '[data-toggle="modal"], [data-bs-toggle="modal"], [aria-haspopup="dialog"], button[data-modal]',
    action: 'click',
    waitFor: '[role="dialog"], .modal.show, .modal.is-active, dialog[open]',
  },
  // Dropdown menus
  {
    name: 'Open dropdown menus',
    selector: '[data-toggle="dropdown"], [data-bs-toggle="dropdown"], [aria-haspopup="menu"], [aria-haspopup="listbox"]',
    action: 'click',
    waitFor: '[role="menu"], [role="listbox"], .dropdown-menu.show',
  },
  // Accordions
  {
    name: 'Expand accordions',
    selector: '[data-toggle="collapse"], [data-bs-toggle="collapse"], [aria-expanded="false"], details:not([open]) > summary',
    action: 'click',
  },
  // Tabs
  {
    name: 'Activate tab panels',
    selector: '[role="tab"]:not([aria-selected="true"])',
    action: 'click',
    waitFor: '[role="tabpanel"]',
  },
  // Tooltips
  {
    name: 'Show tooltips',
    selector: '[data-tooltip], [data-bs-toggle="tooltip"], [title]:not(svg title)',
    action: 'hover',
  },
  // Mobile navigation
  {
    name: 'Open mobile navigation',
    selector: '.hamburger, .menu-toggle, [aria-label*="menu" i], [aria-label*="navigation" i], button.navbar-toggler',
    action: 'click',
    waitFor: 'nav, .nav-menu, .mobile-menu',
  },
];

/**
 * Run interaction triggers on a page to reveal dynamic content before scanning.
 */
export async function runInteractionTriggers(
  page: Page,
  customTriggers: InteractionTrigger[],
  enableDefaults: boolean,
): Promise<TriggerResult[]> {
  const results: TriggerResult[] = [];
  const triggers = [
    ...(enableDefaults ? DEFAULT_TRIGGERS : []),
    ...customTriggers,
  ];

  for (const trigger of triggers) {
    try {
      const elements = await page.$$(trigger.selector);

      if (elements.length === 0) {
        results.push({ name: trigger.name, status: 'skipped', message: 'No matching elements' });
        continue;
      }

      // Only interact with the first few elements to avoid excessive clicking
      const maxInteractions = 3;
      let triggered = 0;

      for (const element of elements.slice(0, maxInteractions)) {
        try {
          const isVisible = await element.isVisible();
          if (!isVisible) continue;

          switch (trigger.action) {
            case 'click':
              await element.click({ timeout: 2000 });
              break;
            case 'hover':
              await element.hover({ timeout: 2000 });
              break;
            case 'focus':
              await element.focus();
              break;
          }

          triggered++;

          // Wait for the expected element to appear
          if (trigger.waitFor) {
            await page.waitForSelector(trigger.waitFor, { timeout: 2000 }).catch(() => {
              // Not finding the waitFor element is not fatal
            });
          }

          // Small pause for animations
          await page.waitForTimeout(300);
        } catch {
          // Individual element interaction failure — continue to next
        }
      }

      if (triggered > 0) {
        results.push({
          name: trigger.name,
          status: 'triggered',
          message: `Interacted with ${triggered}/${elements.length} element(s)`,
        });
      } else {
        results.push({ name: trigger.name, status: 'skipped', message: 'Elements found but none visible/interactable' });
      }
    } catch (err) {
      results.push({
        name: trigger.name,
        status: 'error',
        message: (err as Error).message,
      });
    }
  }

  return results;
}
