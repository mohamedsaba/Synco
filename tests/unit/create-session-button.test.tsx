// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import { CreateSessionButton } from '../../apps/web/app/create-session-button';

describe('CreateSessionButton', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    (
      globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    push.mockReset();
    await act(async () => root.render(<CreateSessionButton />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('creates the supported scenario from the homepage control', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidatePath: '/candidate/token-1' }),
    });
    vi.stubGlobal('fetch', fetch);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button')?.click();
    });

    expect(fetch).toHaveBeenCalledWith('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'scenario-001-cache-staleness' }),
    });
    expect(push).toHaveBeenCalledWith('/candidate/token-1');
  });
});
