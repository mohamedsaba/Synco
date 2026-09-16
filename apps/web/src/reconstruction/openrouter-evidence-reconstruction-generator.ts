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
  reconstructionPromptVersion,
  reconstructionSystemPrompt,
} from './reconstruction-prompt';
import { reconstructionOutputJsonSchema } from './reconstruction-output-validator';

export const openRouterProviderId = 'openrouter';
export const openRouterEndpoint =
  'https://openrouter.ai/api/v1/chat/completions';

export type OpenRouterModelConfiguration = Readonly<{
  modelId: string;
  supportsStructuredOutput: boolean;
}>;

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

const logProviderFailure = (
  model: string,
  category: 'request_aborted' | 'request_failed' | 'http_failure',
  status?: number,
) => {
  console.error('OpenRouter reconstruction request failed.', {
    provider: openRouterProviderId,
    model,
    category,
    ...(status === undefined ? {} : { status }),
  });
};

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

const assertExplicitModel = (modelId: string) => {
  const normalized = modelId.trim();
  if (
    !normalized ||
    normalized === 'openrouter/free' ||
    !normalized.includes('/')
  ) {
    throw providerFailure(
      'PROVIDER_NOT_CONFIGURED',
      'An explicit OpenRouter model ID is required.',
    );
  }
  return normalized;
};

export class OpenRouterEvidenceReconstructionGenerator implements EvidenceReconstructionGenerator {
  readonly providerId = openRouterProviderId;
  readonly modelId: string;
  readonly versionId = reconstructionPromptVersion;

  constructor(
    private readonly apiKey: string,
    private readonly configuration: OpenRouterModelConfiguration,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {
    if (!apiKey.trim()) {
      throw providerFailure(
        'PROVIDER_NOT_CONFIGURED',
        'OPENROUTER_KEY is not configured.',
      );
    }
    this.modelId = assertExplicitModel(configuration.modelId);
  }

  async generate(
    packet: EvidencePacketV1,
    options: Readonly<{ signal: AbortSignal }>,
  ): Promise<GeneratedReconstruction> {
    const body: Record<string, unknown> = {
      model: this.modelId,
      messages: [
        { role: 'system', content: reconstructionSystemPrompt },
        { role: 'user', content: buildReconstructionUserPrompt(packet) },
      ],
      temperature: 0.2,
      reasoning: { effort: 'none' },
      max_tokens: 2_048,
      stream: false,
    };
    if (this.configuration.supportsStructuredOutput) {
      body.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'delimit_evidence_reconstruction_v1',
          strict: true,
          schema: reconstructionOutputJsonSchema,
        },
      };
      body.provider = { require_parameters: true };
    }

    let response: Response;
    try {
      response = await this.fetchImplementation(openRouterEndpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });
    } catch {
      if (options.signal.aborted) {
        logProviderFailure(this.modelId, 'request_aborted');
        throw providerFailure(
          'PROVIDER_TIMEOUT',
          'The reconstruction provider request was aborted.',
        );
      }
      logProviderFailure(this.modelId, 'request_failed');
      throw providerFailure(
        'PROVIDER_UNAVAILABLE',
        'The reconstruction provider is unavailable.',
      );
    }

    if (response.status !== 200) {
      logProviderFailure(this.modelId, 'http_failure', response.status);
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
      providerId: openRouterProviderId,
      modelId: this.modelId,
      requestId: parsedEnvelope.data.id,
    };
  }
}
