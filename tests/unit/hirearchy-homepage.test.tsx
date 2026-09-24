import { readFileSync } from 'node:fs';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import HomePage from '../../apps/web/app/page';
import { CampaignSection } from '../../apps/web/app/home/campaign-section';
import { ClaritySection } from '../../apps/web/app/home/clarity-section';
import { EvidenceNarrativeSection } from '../../apps/web/app/home/evidence-narrative-section';
import { HirearchySoftwareSection } from '../../apps/web/app/home/hirearchy-software-section';

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

  it('keeps evidence as one ordered, non-judgmental work record', () => {
    const html = renderToStaticMarkup(<EvidenceNarrativeSection />);
    const events = Array.from(
      html.matchAll(/<strong>([^<]+)<\/strong>/g),
      ([, event]) => event,
    );

    expect(events).toEqual([
      'Attempt',
      'Verification',
      'Failure',
      'Investigation',
      'Revision',
      'Outcome',
    ]);
    expect(html).toContain('<ol aria-label="Observed work sequence">');
    expect(html.match(/<li>/g)).toHaveLength(6);
    expect(html).toContain('A limit becomes visible.');
    expect(html).toContain('without deciding what they mean about a person');
    expect(html).not.toMatch(/competence|score|ranking|hire|reject/i);
  });

  it('structures clarity as evidence states without making a judgment', () => {
    const html = renderToStaticMarkup(<ClaritySection />);

    expect(html).toContain('<dl class="clarity__layers">');
    expect(html).toContain('Observed');
    expect(html).toContain('Changed');
    expect(html).toContain('Verified');
    expect(html).toContain('Unresolved');
    expect(html).toContain('What remains uncertain');
    expect(html).toContain('More context. Less guessing.');
    expect(html).not.toMatch(
      /\b(score|ranking|pass|fail|recommendation|probability)\b/i,
    );
  });

  it('bridges the masterbrand to Hirearchy Software via candidate work, evidence conduit, and evaluator review', () => {
    const html = renderToStaticMarkup(<HirearchySoftwareSection />);

    expect(html).toContain('Hirearchy Software');
    expect(html).toContain('Candidate environment');
    expect(html).toContain('Controlled engineering scenario');
    expect(html).toContain('Observable evidence pipeline');
    expect(html).toContain('Evaluator review');
    expect(html).toContain('Evidence-led reconstruction');
    expect(html).toContain('AI is permitted tooling inside the environment.');
    expect(html).toContain('The final hiring decision remains human.');
    expect(html).toContain('href="/evaluator"');
    expect(html).toContain('href="#get-started"');
    expect(html).not.toMatch(
      /\b(score|grade|pass\/fail|ranking|cheating|automatic)\b/i,
    );
  });

  it('provides semantic section names and real product destinations', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html.match(/<section/g)).toHaveLength(8);
    expect(html.match(/aria-labelledby=/g)).toHaveLength(8);
    expect(html).toContain('href="/evaluator"');
    expect(html).toContain('Start a software assessment');
  });

  it('elevates the brand line into an ownable campaign moment with contrast motion', () => {
    const html = renderToStaticMarkup(<CampaignSection />);

    expect(html).toContain('id="campaign-title"');
    expect(html).toContain('data-motion="contrast"');
    expect(html).toContain('Evidence');
    expect(html).toContain('over');
    expect(html).toContain('impressions.');
    expect(html).toContain('A résumé opens a conversation.');
    expect(html).toContain('Work adds context.');
    expect(html).toContain('The observable record precedes interpretation.');
    expect(html).not.toMatch(
      /\b(score|grade|ranking|revolutionize|guarantee|superior)\b/i,
    );
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
