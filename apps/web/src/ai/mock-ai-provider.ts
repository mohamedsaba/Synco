import type {
  AiProvider,
  AiProviderExecutionOptions,
  NormalizedAiRequest,
  NormalizedAiResult,
} from './ai-provider';

export type MockAiResponder = (
  request: NormalizedAiRequest,
  options?: AiProviderExecutionOptions,
) => Promise<NormalizedAiResult> | NormalizedAiResult;

export type MockAiProviderOptions = Readonly<{
  providerId?: string;
  defaultResponseText?: string;
  responder?: MockAiResponder;
  simulatedError?: Error | null;
  delayMs?: number;
}>;

export class MockAiProvider implements AiProvider {
  readonly providerId: string;
  private responder?: MockAiResponder;
  private simulatedError: Error | null = null;
  private delayMs: number = 0;
  private readonly defaultResponseText: string;

  constructor(options?: MockAiProviderOptions) {
    this.providerId = options?.providerId ?? 'mock-ai';
    this.defaultResponseText =
      options?.defaultResponseText ?? 'Mock response for: ';
    this.responder = options?.responder;
    this.simulatedError = options?.simulatedError ?? null;
    this.delayMs = options?.delayMs ?? 0;
  }

  setResponder(responder?: MockAiResponder): void {
    this.responder = responder;
  }

  setSimulatedError(error: Error | null): void {
    this.simulatedError = error;
  }

  setDelayMs(delayMs: number): void {
    this.delayMs = delayMs;
  }

  async execute(
    request: NormalizedAiRequest,
    options?: AiProviderExecutionOptions,
  ): Promise<NormalizedAiResult> {
    if (options?.signal?.aborted) {
      throw options.signal.reason ?? new Error('Operation aborted');
    }

    if (this.delayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          options?.signal?.removeEventListener('abort', onAbort);
          resolve();
        }, this.delayMs);

        const onAbort = () => {
          clearTimeout(timer);
          options?.signal?.removeEventListener('abort', onAbort);
          reject(options?.signal?.reason ?? new Error('Operation aborted'));
        };

        if (options?.signal?.aborted) {
          onAbort();
        } else {
          options?.signal?.addEventListener('abort', onAbort, { once: true });
        }
      });
    }

    if (this.simulatedError) {
      throw this.simulatedError;
    }

    if (this.responder) {
      return this.responder(request, options);
    }

    return {
      responseText: `${this.defaultResponseText}${request.candidateInput}`,
      reportedModelId: request.configuredModelId,
      providerRequestId: `mock_req_${Date.now()}`,
      finishReason: 'stop',
      tokenUsage: {
        promptTokens: Math.ceil(request.candidateInput.length / 4),
        completionTokens: Math.ceil(
          (this.defaultResponseText.length + request.candidateInput.length) / 4,
        ),
        totalTokens:
          Math.ceil(request.candidateInput.length / 4) +
          Math.ceil(
            (this.defaultResponseText.length + request.candidateInput.length) /
              4,
          ),
      },
    };
  }
}
