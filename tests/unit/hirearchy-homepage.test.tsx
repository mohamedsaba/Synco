import { readFileSync } from 'node:fs';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import HomePage from '../../apps/web/app/page';

describe('D1 — Hirearchy homepage', () => {
  it('renders the masterbrand narrative and keeps hiring judgment human', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('<h1 id="hero-title">Hirearchy</h1>');
    expect(html).toContain('Evidence over impressions.');
    expect(html).toContain('Hirearchy Software');
    expect(html).toContain('Future direction');
    expect(html).toContain('The final hiring decision remains human.');
    expect(html).toContain('AI is permitted tooling inside the environment.');
    expect(html).not.toContain('01 / 06');
    expect(html).not.toMatch(/candidate (score|grade)|pass\/fail|ranking/i);
  });

  it('uses the eight distinct semantic motion primitives in order', () => {
    const html = renderToStaticMarkup(<HomePage />);
    const motions = Array.from(
      html.matchAll(/data-motion="([^"]+)"/g),
      ([, motion]) => motion,
    );

    expect(motions).toEqual([
      'organize',
      'reframe',
      'unfold',
      'prioritize',
      'adapt',
      'enter',
      'contrast',
      'settle',
    ]);
    expect(new Set(motions).size).toBe(motions.length);
  });

  it('provides semantic section names and real product destinations', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html.match(/<section/g)).toHaveLength(8);
    expect(html.match(/aria-labelledby=/g)).toHaveLength(8);
    expect(html).toContain('href="/evaluator"');
    expect(html).toContain('Start a software assessment');
  });

  it('keeps motion optional and supplies an explicit reduced-motion contract', () => {
    const css = readFileSync(
      new URL('../../apps/web/app/home.css', import.meta.url),
      'utf8',
    );

    expect(css).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation-duration: 0.001ms !important');
    expect(css).toContain('transition-duration: 0.001ms !important');
  });
});
