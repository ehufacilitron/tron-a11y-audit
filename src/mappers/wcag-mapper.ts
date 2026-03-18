import type { WcagCriterion } from '../types/report-types.js';

/**
 * Map axe-core WCAG tags to human-readable success criteria.
 */
const WCAG_CRITERIA: Record<string, WcagCriterion> = {
  // WCAG 2.0 Level A
  'wcag111': { id: '1.1.1', name: 'Non-text Content', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content' },
  'wcag121': { id: '1.2.1', name: 'Audio-only and Video-only (Prerecorded)', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/audio-only-and-video-only-prerecorded' },
  'wcag122': { id: '1.2.2', name: 'Captions (Prerecorded)', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded' },
  'wcag123': { id: '1.2.3', name: 'Audio Description or Media Alternative (Prerecorded)', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/audio-description-or-media-alternative-prerecorded' },
  'wcag131': { id: '1.3.1', name: 'Info and Relationships', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships' },
  'wcag132': { id: '1.3.2', name: 'Meaningful Sequence', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence' },
  'wcag133': { id: '1.3.3', name: 'Sensory Characteristics', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics' },
  'wcag141': { id: '1.4.1', name: 'Use of Color', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color' },
  'wcag142': { id: '1.4.2', name: 'Audio Control', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/audio-control' },
  'wcag211': { id: '2.1.1', name: 'Keyboard', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard' },
  'wcag212': { id: '2.1.2', name: 'No Keyboard Trap', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap' },
  'wcag221': { id: '2.2.1', name: 'Timing Adjustable', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable' },
  'wcag222': { id: '2.2.2', name: 'Pause, Stop, Hide', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide' },
  'wcag231': { id: '2.3.1', name: 'Three Flashes or Below Threshold', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold' },
  'wcag241': { id: '2.4.1', name: 'Bypass Blocks', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks' },
  'wcag242': { id: '2.4.2', name: 'Page Titled', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled' },
  'wcag243': { id: '2.4.3', name: 'Focus Order', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order' },
  'wcag244': { id: '2.4.4', name: 'Link Purpose (In Context)', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context' },
  'wcag251': { id: '2.5.1', name: 'Pointer Gestures', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures' },
  'wcag252': { id: '2.5.2', name: 'Pointer Cancellation', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation' },
  'wcag253': { id: '2.5.3', name: 'Label in Name', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/label-in-name' },
  'wcag254': { id: '2.5.4', name: 'Motion Actuation', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation' },
  'wcag311': { id: '3.1.1', name: 'Language of Page', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page' },
  'wcag321': { id: '3.2.1', name: 'On Focus', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/on-focus' },
  'wcag322': { id: '3.2.2', name: 'On Input', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/on-input' },
  'wcag331': { id: '3.3.1', name: 'Error Identification', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification' },
  'wcag332': { id: '3.3.2', name: 'Labels or Instructions', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions' },
  'wcag411': { id: '4.1.1', name: 'Parsing', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/parsing' },
  'wcag412': { id: '4.1.2', name: 'Name, Role, Value', level: 'A', url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value' },

  // WCAG 2.0 Level AA
  'wcag124': { id: '1.2.4', name: 'Captions (Live)', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-live' },
  'wcag125': { id: '1.2.5', name: 'Audio Description (Prerecorded)', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/audio-description-prerecorded' },
  'wcag143': { id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum' },
  'wcag144': { id: '1.4.4', name: 'Resize Text', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/resize-text' },
  'wcag145': { id: '1.4.5', name: 'Images of Text', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/images-of-text' },
  'wcag245': { id: '2.4.5', name: 'Multiple Ways', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways' },
  'wcag246': { id: '2.4.6', name: 'Headings and Labels', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels' },
  'wcag247': { id: '2.4.7', name: 'Focus Visible', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible' },
  'wcag312': { id: '3.1.2', name: 'Language of Parts', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts' },
  'wcag323': { id: '3.2.3', name: 'Consistent Navigation', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation' },
  'wcag324': { id: '3.2.4', name: 'Consistent Identification', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification' },
  'wcag333': { id: '3.3.3', name: 'Error Suggestion', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion' },
  'wcag334': { id: '3.3.4', name: 'Error Prevention (Legal, Financial, Data)', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data' },

  // WCAG 2.1 Level A additions
  'wcag134': { id: '1.3.4', name: 'Orientation', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/orientation' },
  'wcag135': { id: '1.3.5', name: 'Identify Input Purpose', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose' },

  // WCAG 2.1 Level AA additions
  'wcag1410': { id: '1.4.10', name: 'Reflow', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/reflow' },
  'wcag1411': { id: '1.4.11', name: 'Non-text Contrast', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast' },
  'wcag1412': { id: '1.4.12', name: 'Text Spacing', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/text-spacing' },
  'wcag1413': { id: '1.4.13', name: 'Content on Hover or Focus', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus' },
  'wcag413': { id: '4.1.3', name: 'Status Messages', level: 'AA', url: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages' },
};

/**
 * Extract WCAG success criteria from axe-core tags.
 *
 * axe tags look like: ['wcag2a', 'wcag111', 'best-practice']
 * We match the numeric ones (e.g. 'wcag111') to our criteria map.
 */
export function mapWcagTags(tags: string[]): WcagCriterion[] {
  const criteria: WcagCriterion[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    // Match tags like 'wcag111', 'wcag143', 'wcag1410'
    const match = tag.match(/^wcag(\d{3,4})$/);
    if (match) {
      const criterion = WCAG_CRITERIA[tag];
      if (criterion && !seen.has(criterion.id)) {
        seen.add(criterion.id);
        criteria.push(criterion);
      }
    }
  }

  return criteria;
}

/**
 * Get all criteria at or below a given conformance level.
 */
export function getCriteriaForLevel(level: 'A' | 'AA' | 'AAA'): WcagCriterion[] {
  const levels: string[] = ['A'];
  if (level === 'AA' || level === 'AAA') levels.push('AA');
  if (level === 'AAA') levels.push('AAA');

  return Object.values(WCAG_CRITERIA).filter((c) => levels.includes(c.level));
}
