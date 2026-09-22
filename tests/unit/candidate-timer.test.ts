import { describe, expect, it } from 'vitest';

import {
  TIMER_ATTENTION_MS,
  TIMER_URGENT_MS,
  presentCandidateTimer,
} from '../../apps/web/src/candidate/candidate-timer';

describe('C7 — Candidate timer presentation', () => {
  it('derives a stable display from projected remaining milliseconds', () => {
    expect(presentCandidateTimer(3_600_000, 3_600)).toMatchObject({
      display: '1:00:00',
      state: 'NORMAL',
    });
    expect(presentCandidateTimer(3_599_000, 3_600)).toMatchObject({
      display: '0:59:59',
      state: 'NORMAL',
    });
  });

  it('uses ceiling rounding so a pre-deadline projection never displays zero', () => {
    expect(presentCandidateTimer(1, 900)).toMatchObject({ display: '00:01' });
    expect(presentCandidateTimer(0, 900)).toMatchObject({ display: '00:00' });
    expect(presentCandidateTimer(-1, 900)).toMatchObject({ display: '00:00' });
  });

  it('uses exact, color-independent threshold states', () => {
    expect(presentCandidateTimer(TIMER_ATTENTION_MS + 1, 900)?.state).toBe(
      'NORMAL',
    );
    expect(presentCandidateTimer(TIMER_ATTENTION_MS, 900)).toMatchObject({
      state: 'ATTENTION',
      statusText: '5 minutes remaining.',
    });
    expect(presentCandidateTimer(TIMER_URGENT_MS + 1, 900)?.state).toBe(
      'ATTENTION',
    );
    expect(presentCandidateTimer(TIMER_URGENT_MS, 900)).toMatchObject({
      state: 'URGENT',
      statusText: '1 minute or less remaining.',
    });
  });

  it('does not fabricate a timer for untimed sessions', () => {
    expect(presentCandidateTimer(null, null)).toBeNull();
  });

  it('represents expiry without claiming submission', () => {
    expect(presentCandidateTimer(0, 900)).toMatchObject({
      state: 'EXPIRED',
      statusText: 'Time limit reached.',
    });
  });
});
