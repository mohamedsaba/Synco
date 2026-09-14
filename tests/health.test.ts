import { describe, expect, it } from 'vitest';

import { getHealthStatus } from '../apps/web/src/health';

describe('getHealthStatus', () => {
  it('returns a stable diagnostic response', () => {
    expect(getHealthStatus()).toEqual({
      service: 'delimit-web',
      status: 'ok',
    });
  });
});
