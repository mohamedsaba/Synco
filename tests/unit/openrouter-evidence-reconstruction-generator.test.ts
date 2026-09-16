import { describe, expect, it, vi } from 'vitest';

import type { EvidencePacketV1 } from '../../apps/web/src/reconstruction/evidence-packet';
import {
  OpenRouterEvidenceReconstructionGenerator,
  openRouterEndpoint,
  openRouterProviderId,
} from '../../apps/web/src/reconstruction/openrouter-evidence-reconstruction-generator';

const packet: EvidencePacketV1 = {
  schemaVersion: 1,
  scenario: {
    title: 'Synthetic scenario',
    candidateBrief: 'Synthetic brief',
    candidateAcceptanceCriteria: ['Synthetic criterion'],
  },
  session: {
    activatedAt: '2026-09-15T10:00:00.000Z',
    submittedAt: '2026-09-15T10:05:00.000Z',
  },
  evidenceItems: [],
  finalDiff: {
    evidenceRef: 'session:synthetic:final-diff',
    excerpt: '',
    excerptBytes: 0,
    totalBytes: 0,
    truncated: false,
    sha256: 'synthetic',
  },
  integrity: {
    workspaceGapRefs: [],
    outOfBandChangeRefs: [],
    truncatedEvidenceRefs: [],
  },
  coverageAnchors: [],
};

const successfulResponse = () =>
  new Response(
    JSON.stringify({
      id: 'openrouter-request-1',
      choices: [
        {
          message: {
            content: JSON.stringify({ schemaVersion: 1, statements: [] }),
          },
        },
      ],
    }),
    { status: 200 },
  );

describe('OpenRouter evidence reconstruction generator', () => {
  it('uses an explicit structured-output model with equivalent bounded settings', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(successfulResponse());
    const modelId = 'nvidia/nemotron-3-super-120b-a12b:free';
    const generator = new OpenRouterEvidenceReconstructionGenerator(
      'synthetic-key',
      { modelId, supportsStructuredOutput: true },
      fetchImplementation,
    );

    await expect(
      generator.generate(packet, { signal: new AbortController().signal }),
    ).resolves.toEqual({
      output: { schemaVersion: 1, statements: [] },
      providerId: openRouterProviderId,
      modelId,
      requestId: 'openrouter-request-1',
    });

    const [url, request] = fetchImplementation.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(openRouterEndpoint);
    const body = JSON.parse(String(request.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: modelId,
      response_format: {
        type: 'json_schema',
        json_schema: { strict: true },
      },
      provider: { require_parameters: true },
      temperature: 0.2,
      reasoning: { effort: 'none' },
      max_tokens: 2048,
      stream: false,
    });
    expect(request.signal).toBeInstanceOf(AbortSignal);
  });

  it('omits schema routing for an explicit model that does not support it', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(successfulResponse());
    const generator = new OpenRouterEvidenceReconstructionGenerator(
      'synthetic-key',
      {
        modelId: 'nvidia/nemotron-3.5-lightning:free',
        supportsStructuredOutput: false,
      },
      fetchImplementation,
    );

    await generator.generate(packet, {
      signal: new AbortController().signal,
    });

    const [, request] = fetchImplementation.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(request.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty('response_format');
    expect(body).not.toHaveProperty('provider');
  });

  it('rejects nondeterministic router aliases', () => {
    expect(
      () =>
        new OpenRouterEvidenceReconstructionGenerator('synthetic-key', {
          modelId: 'openrouter/free',
          supportsStructuredOutput: false,
        }),
    ).toThrow('explicit OpenRouter model ID');
  });

  it('maps provider errors without consuming or logging the response body', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const response = new Response('credential detail', { status: 503 });
    const fetchImplementation = vi.fn().mockResolvedValue(response);
    const modelId = 'nvidia/nemotron-3-super-120b-a12b:free';
    const generator = new OpenRouterEvidenceReconstructionGenerator(
      'synthetic-key',
      { modelId, supportsStructuredOutput: true },
      fetchImplementation,
    );

    await expect(
      generator.generate(packet, { signal: new AbortController().signal }),
    ).rejects.toMatchObject({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'The reconstruction provider is unavailable.',
    });

    expect(response.bodyUsed).toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      'OpenRouter reconstruction request failed.',
      {
        provider: openRouterProviderId,
        model: modelId,
        category: 'http_failure',
        status: 503,
      },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      'credential detail',
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      'synthetic-key',
    );
    consoleError.mockRestore();
  });

  it('fails safely when OpenRouter returns invalid JSON content', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'openrouter-request-2',
          choices: [{ message: { content: 'not json' } }],
        }),
        { status: 200 },
      ),
    );
    const generator = new OpenRouterEvidenceReconstructionGenerator(
      'synthetic-key',
      {
        modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
        supportsStructuredOutput: true,
      },
      fetchImplementation,
    );

    await expect(
      generator.generate(packet, { signal: new AbortController().signal }),
    ).rejects.toMatchObject({ code: 'MALFORMED_OUTPUT' });
  });
});
