import { z } from 'zod';

import type { EvidencePacketV1 } from './evidence-packet';
import {
  EvidenceReconstructionError,
  type ReconstructionFailureCode,
} from './evidence-reconstruction';
import type {
  EvidenceReconstructionGenerator,
  GeneratedReconstruction,
} from './evidence-reconstruction-generator';
import {
  buildReconstructionUserPrompt,
  reconstructionSystemPrompt,
} from './reconstruction-prompt';
import { reconstructionOutputJsonSchema } from './reconstruction-output-validator';

export const nvidiaNimProviderId = 'nvidia-nim-hosted';
export const nvidiaNimModelId = 'nvidia/nemotron-3.5-lightning-30b-a3b';
export const nvidiaNimEndpoint =
  'https://integrate.api.nvidia.com/v1/chat/completions';

const responseSchema = z
  .object({
    id: z.string().min(1).max(200),
    choices: z
      .array(
        z.object({
          message: z.object({ content: z.string().min(1) }).passthrough(),
        }),
      )
      .min(1),
  })
  .passthrough();

const providerFailure = (code: ReconstructionFailureCode, message: string) =>
  new EvidenceReconstructionError(code, message);

const mapHttpFailure = (status: number) => {
  if (status === 429) {
    return providerFailure(
      'PROVIDER_RATE_LIMITED',
      'The reconstruction provider rate limit was reached.',
    );
  }
  if (status === 408 || status === 504) {
    return providerFailure(
      'PROVIDER_TIMEOUT',
      'The reconstruction provider timed out.',
    );
  }
  return providerFailure(
    'PROVIDER_UNAVAILABLE',
    'The reconstruction provider is unavailable.',
  );
};

export class NvidiaNimEvidenceReconstructionGenerator implements EvidenceReconstructionGenerator {
  readonly providerId = nvidiaNimProviderId;
  readonly modelId = nvidiaNimModelId;

  constructor(
    private readonly apiKey: string,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {
    if (!apiKey.trim()) {
      throw providerFailure(
        'PROVIDER_NOT_CONFIGURED',
        'NVIDIA_API_KEY is not configured.',
      );
    }
  }

  async generate(
    packet: EvidencePacketV1,
    options: Readonly<{ signal: AbortSignal }>,
  ): Promise<GeneratedReconstruction> {
    let response: Response;
    try {
      response = await this.fetchImplementation(nvidiaNimEndpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: nvidiaNimModelId,
          messages: [
            { role: 'system', content: reconstructionSystemPrompt },
            { role: 'user', content: buildReconstructionUserPrompt(packet) },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'delimit_evidence_reconstruction_v1',
              strict: true,
              schema: reconstructionOutputJsonSchema,
            },
          },
          temperature: 0.2,
          chat_template_kwargs: { enable_thinking: false },
          max_tokens: 2_048,
          stream: false,
        }),
        signal: options.signal,
      });
    } catch (error) {
      console.error('NVIDIA NIM fetch caught error:', error);
      if (options.signal.aborted) {
        throw providerFailure(
          'PROVIDER_TIMEOUT',
          'The reconstruction provider request was aborted.',
        );
      }
      throw providerFailure(
        'PROVIDER_UNAVAILABLE',
        'The reconstruction provider is unavailable.',
      );
    }

    if (response.status !== 200) {
      const body = await response.text().catch(() => '');
      console.error('NVIDIA NIM HTTP status:', response.status, 'body:', body);
      throw mapHttpFailure(response.status);
    }

    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch {
      throw providerFailure(
        'MALFORMED_OUTPUT',
        'The reconstruction provider returned an invalid response envelope.',
      );
    }
    const parsedEnvelope = responseSchema.safeParse(envelope);
    if (!parsedEnvelope.success) {
      throw providerFailure(
        'MALFORMED_OUTPUT',
        'The reconstruction provider returned an invalid response envelope.',
      );
    }

    let output: unknown;
    try {
      output = JSON.parse(parsedEnvelope.data.choices[0].message.content);
    } catch {
      throw providerFailure(
        'MALFORMED_OUTPUT',
        'The reconstruction provider returned invalid JSON.',
      );
    }

    return {
      output,
      providerId: nvidiaNimProviderId,
      modelId: nvidiaNimModelId,
      requestId: parsedEnvelope.data.id,
    };
  }
}
