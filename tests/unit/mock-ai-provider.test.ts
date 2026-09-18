import { describe, expect, it } from 'vitest';

import { MockAiProvider } from '../../apps/web/src/ai/mock-ai-provider';

describe('MockAiProvider', () => {
  it('executes and returns default deterministic response', async () => {
    const provider = new MockAiProvider();
    expect(provider.providerId).toBe('mock-ai');

    const result = await provider.execute({
      configuredModelId: 'mock-chat-v1',
      candidateInput: 'Explain the cache bug.',
    });

    expect(result.responseText).toBe(
      'Mock response for: Explain the cache bug.',
    );
    expect(result.reportedModelId).toBe('mock-chat-v1');
    expect(result.finishReason).toBe('stop');
    expect(result.tokenUsage?.promptTokens).toBeGreaterThan(0);
    expect(result.tokenUsage?.completionTokens).toBeGreaterThan(0);
  });

  it('supports custom responder function', async () => {
    const provider = new MockAiProvider({
      responder: (req) => ({
        responseText: `Custom answer for: ${req.candidateInput.toUpperCase()}`,
        reportedModelId: 'custom-model',
      }),
    });

    const result = await provider.execute({
      configuredModelId: 'mock-chat-v1',
      candidateInput: 'hello world',
    });

    expect(result.responseText).toBe('Custom answer for: HELLO WORLD');
    expect(result.reportedModelId).toBe('custom-model');
  });

  it('simulates provider errors when configured', async () => {
    const provider = new MockAiProvider({
      simulatedError: new Error('Provider overloaded (503)'),
    });

    await expect(
      provider.execute({
        configuredModelId: 'mock-chat-v1',
        candidateInput: 'test error',
      }),
    ).rejects.toThrow('Provider overloaded (503)');
  });

  it('respects abort signal and cancels delayed execution', async () => {
    const provider = new MockAiProvider({
      delayMs: 200,
    });

    const controller = new AbortController();
    setTimeout(() => {
      controller.abort(new Error('Caller aborted'));
    }, 50);

    await expect(
      provider.execute(
        {
          configuredModelId: 'mock-chat-v1',
          candidateInput: 'delayed prompt',
        },
        { signal: controller.signal },
      ),
    ).rejects.toThrow('Caller aborted');
  });

  it('rejects immediately if signal is already aborted', async () => {
    const provider = new MockAiProvider();
    const controller = new AbortController();
    controller.abort(new Error('Pre-aborted'));

    await expect(
      provider.execute(
        {
          configuredModelId: 'mock-chat-v1',
          candidateInput: 'pre-aborted prompt',
        },
        { signal: controller.signal },
      ),
    ).rejects.toThrow('Pre-aborted');
  });
});
