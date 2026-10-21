import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Reads the colour tokens straight from _tokens.scss, so the file stays the
// single source of truth, and checks every text/background pair the design
// system uses against WCAG 2.2: 4.5:1 for text, 3:1 for borders and focus rings.
const scss = readFileSync(join(__dirname, '_tokens.scss'), 'utf8');
const colours = new Map(
  [...scss.matchAll(/^\$(color-[\w-]+):\s*(#[0-9a-f]{6});/gim)].map(([, name, hex]) => [name, hex]),
);

function colour(name: string): string {
  const hex = colours.get(name);
  if (!hex) throw new Error(`No token $${name} in _tokens.scss`);
  return hex;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(colour(a)), luminance(colour(b))].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const textPairs: [foreground: string, background: string][] = [
  ['color-text', 'color-bg'],
  ['color-text', 'color-surface'],
  ['color-text-muted', 'color-bg'],
  ['color-text-muted', 'color-surface'],
  ['color-brand', 'color-bg'],
  ['color-brand', 'color-surface'],
  ['color-on-brand', 'color-brand'],
  ['color-on-brand', 'color-brand-strong'],
  ['color-error', 'color-bg'],
  ['color-info-text', 'color-info-bg'],
  ['color-success-text', 'color-success-bg'],
  ['color-error-text', 'color-error-bg'],
];

const uiPairs: [foreground: string, background: string][] = [
  ['color-border-strong', 'color-bg'],
  ['color-focus', 'color-bg'],
  ['color-focus', 'color-surface'],
];

describe('colour tokens', () => {
  it.each(textPairs)('%s on %s has at least 4.5:1 contrast', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(uiPairs)('%s on %s has at least 3:1 contrast', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
