import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** The only axe rule this layer enforces. */
const CONTRAST_RULE = 'color-contrast';

/**
 * Text must meet WCAG AA contrast against its background.
 *
 * jsdom computes no styles and pixel diffs cannot name a ratio, so this runs
 * axe's `color-contrast` rule (and only that rule) in real Chromium. Elements
 * axe cannot decide (`incomplete`, e.g. text over images) are not failures.
 * The failure message lists each offending node's selector and axe's
 * `failureSummary`, which carries the measured ratio and colors.
 */
export async function expectNoContrastViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withRules([CONTRAST_RULE]).analyze();

  const nodes = violations.flatMap((violation) => violation.nodes);
  const report = nodes
    .map((node) => `${node.target.join(' ')}\n  ${node.failureSummary?.replace(/\n/g, '\n  ')}`)
    .join('\n');

  // Count, not the violation objects: a deep diff would bury the report.
  expect(nodes.length, `${CONTRAST_RULE} violations:\n${report}`).toBe(0);
}
