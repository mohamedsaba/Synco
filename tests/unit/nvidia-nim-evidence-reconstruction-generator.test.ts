import { describe, expect, it, vi } from 'vitest';

import { EvaluatorAccessError } from '../../apps/web/src/access/evaluator-evidence';
import type { EvidencePacketV1 } from '../../apps/web/src/reconstruction/evidence-packet';
import { getAuthorizedReconstruction } from '../../apps/web/src/reconstruction/evidence-reconstruction-runtime';
import {
  nvidiaNimEndpoint,
  nvidiaNimModelId,
  nvidiaNimProviderId,
  NvidiaNimEvidenceReconstructionGenerator,
} from '../../apps/web/src/reconstruction/nvidia-nim-evidence-reconstruction-generator';

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
      id: 'nim-request-1',
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

describe('NVIDIA NIM evidence reconstruction generator', () => {
  it('does not accept a candidate credential at the reconstruction boundary', () => {
    expect(() =>
      getAuthorizedReconstruction('synthetic-session', 'candidate-token'),
    ).toThrowError(EvaluatorAccessError);
  });

  it('uses the live-proven bounded JSON Schema request', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(successfulResponse());
    const generator = new NvidiaNimEvidenceReconstructionGenerator(
      'synthetic-key',
      fetchImplementation,
    );

    await expect(
      generator.generate(packet, { signal: new AbortController().signal }),
    ).resolves.toEqual({
      output: { schemaVersion: 1, statements: [] },
      providerId: nvidiaNimProviderId,
      modelId: nvidiaNimModelId,
      requestId: 'nim-request-1',
    });

    const [url, request] = fetchImplementation.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(nvidiaNimEndpoint);
    const body = JSON.parse(String(request.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
      response_format: {
        type: 'json_schema',
        json_schema: { strict: true },
      },
      temperature: 0.2,
      chat_template_kwargs: { enable_thinking: false },
      max_tokens: 2048,
      stream: false,
    });
    expect(body).not.toHaveProperty('tools');
    expect(request.signal).toBeInstanceOf(AbortSignal);
  });

  it('maps provider errors without leaking their response body', async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(new Response('credential detail', { status: 503 }));
    const generator = new NvidiaNimEvidenceReconstructionGenerator(
      'synthetic-key',
      fetchImplementation,
    );

    await expect(
      generator.generate(packet, { signal: new AbortController().signal }),
    ).rejects.toMatchObject({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'The reconstruction provider is unavailable.',
    });
  });

  it('fails safely when NIM returns invalid JSON content', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'nim-request-2',
          choices: [{ message: { content: 'not json' } }],
        }),
        { status: 200 },
      ),
    );
    const generator = new NvidiaNimEvidenceReconstructionGenerator(
      'synthetic-key',
      fetchImplementation,
    );

    await expect(
      generator.generate(packet, { signal: new AbortController().signal }),
    ).rejects.toMatchObject({ code: 'MALFORMED_OUTPUT' });
  });

  it('surfaces exact required coverage references before the evidence packet in the user prompt', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(successfulResponse());
    const generator = new NvidiaNimEvidenceReconstructionGenerator(
      'synthetic-key',
      fetchImplementation,
    );

    const packetWithAnchors: EvidencePacketV1 = {
      ...packet,
      coverageAnchors: [
        {
          id: 'anchor_001',
          kind: 'final_observed_command',
          evidenceRefs: ['command:session-1:cmd-1'],
        },
        {
          id: 'anchor_002',
          kind: 'submission_boundary',
          evidenceRefs: ['session:session-1:submitted'],
        },
      ],
    };

    await generator.generate(packetWithAnchors, {
      signal: new AbortController().signal,
    });

    const [, request] = fetchImplementation.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(request.body)) as {
      messages: { role: string; content: string }[];
    };
    const userMessage =
      body.messages.find((message) => message.role === 'user')?.content ?? '';

    expect(userMessage).toContain(
      'Required evidence references for this reconstruction:',
    );
    expect(userMessage).toContain('- command:session-1:cmd-1');
    expect(userMessage).toContain('- session:session-1:submitted');
    expect(userMessage.indexOf('- command:session-1:cmd-1')).toBeLessThan(
      userMessage.indexOf('Evidence packet:'),
    );
  });
});
