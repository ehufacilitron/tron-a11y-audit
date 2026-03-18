import type { Page } from 'playwright';
import type { ResolvedComponent } from '../types/audit-results.js';

/**
 * Walk the Vue 3 component tree on a page to map DOM selectors
 * to their source .vue files.
 *
 * This only works when scanning a Vue dev server — production builds
 * strip the __file metadata. Enable via `enableComponentResolution: true`
 * in audit.config.ts.
 */
export async function resolveVueComponents(page: Page): Promise<Record<string, ResolvedComponent>> {
  const componentMap = await page.evaluate(() => {
    const map: Record<string, { componentFile: string | null; pageFile: string | null }> = {};

    function getSelector(el: Element): string {
      if (el.id) return `#${el.id}`;

      const parts: string[] = [];
      let current: Element | null = el;
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        if (current.id) {
          selector = `#${current.id}`;
          parts.unshift(selector);
          break;
        }
        if (current.className && typeof current.className === 'string') {
          const classes = current.className.trim().split(/\s+/).slice(0, 2).join('.');
          if (classes) selector += `.${classes}`;
        }
        parts.unshift(selector);
        current = current.parentElement;
      }
      return parts.join(' > ');
    }

    function walkTree(el: Element) {
      // Check for Vue 3 component instance
      const vueInstance = (el as any).__vueParentComponent;
      if (vueInstance?.type?.__file) {
        const selector = getSelector(el);
        map[selector] = {
          componentFile: vueInstance.type.__file || null,
          pageFile: null,
        };

        // Try to find the page-level component (root route component)
        let parent = vueInstance.parent;
        while (parent) {
          if (parent.type?.__file && parent.type.__file.includes('/pages/')) {
            map[selector].pageFile = parent.type.__file;
            break;
          }
          parent = parent.parent;
        }
      }

      for (const child of el.children) {
        walkTree(child);
      }
    }

    try {
      walkTree(document.body);
    } catch {
      // Vue component tree walking is best-effort
    }

    return map;
  });

  return componentMap;
}
