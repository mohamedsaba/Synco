import {
  type CandidateContextAttachment,
  MAXIMUM_PROMPT_LENGTH,
} from '../../../src/ai/ai-interaction';

export type SubmissionState =
  'idle' | 'submitting' | 'completed' | 'failed' | 'ambiguous';

export type CompletedInteraction = Readonly<{
  prompt: string;
  responseText: string;
}>;

export type CandidateAiState = Readonly<{
  prompt: string;
  selectedContext: readonly CandidateContextAttachment[];
  submissionState: SubmissionState;
  clientRequestId: string | null;
  errorMessage: string | null;
  completedInteraction: CompletedInteraction | null;
}>;

export const INITIAL_CANDIDATE_AI_STATE: CandidateAiState = {
  prompt: '',
  selectedContext: [],
  submissionState: 'idle',
  clientRequestId: null,
  errorMessage: null,
  completedInteraction: null,
};

export const MAXIMUM_PROMPT_CHARS = MAXIMUM_PROMPT_LENGTH;

export const generateClientRequestId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `client_req_${crypto.randomUUID()}`;
  }
  return `client_req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const setPromptText = (
  state: CandidateAiState,
  prompt: string,
): CandidateAiState => ({
  ...state,
  prompt,
});

export const addContextAttachment = (
  state: CandidateAiState,
  filePath: string,
): CandidateAiState => {
  if (!filePath) return state;
  if (state.selectedContext.some((c) => c.filePath === filePath)) {
    return state;
  }
  return {
    ...state,
    selectedContext: [...state.selectedContext, { filePath }],
  };
};

export const removeContextAttachment = (
  state: CandidateAiState,
  filePath: string,
): CandidateAiState => {
  if (state.submissionState === 'submitting') return state;
  return {
    ...state,
    selectedContext: state.selectedContext.filter(
      (c) => c.filePath !== filePath,
    ),
  };
};

export const startNewRequest = (state: CandidateAiState): CandidateAiState => ({
  ...state,
  submissionState: 'idle',
  clientRequestId: null,
  errorMessage: null,
  // If moving from completed, clear response and prompt.
  // If moving from error/ambiguous/failed, keep candidate prompt so they don't have to retype.
  prompt: state.submissionState === 'completed' ? '' : state.prompt,
  completedInteraction: null,
});

export const beginSubmission = (
  state: CandidateAiState,
  forcedRequestId?: string,
): { nextState: CandidateAiState; requestId: string } | null => {
  if (state.submissionState === 'submitting') {
    return null;
  }
  const trimmed = state.prompt.trim();
  if (!trimmed) {
    return null;
  }

  // Idempotency: reuse existing stable clientRequestId if one exists, otherwise generate new
  const requestId =
    forcedRequestId ?? state.clientRequestId ?? generateClientRequestId();

  return {
    nextState: {
      ...state,
      submissionState: 'submitting',
      clientRequestId: requestId,
      errorMessage: null,
    },
    requestId,
  };
};

export type ServerInteractionResponse = Readonly<{
  status?: string;
  terminalReason?: string | null;
  responseText?: string | null;
  configuredModelId?: string;
  reportedModelId?: string | null;
  interactionId?: string;
  durationMs?: number | null;
  error?: {
    code?: string;
    message?: string;
  };
}>;

export const resolveSubmissionResult = (
  state: CandidateAiState,
  httpStatus: number,
  data: ServerInteractionResponse | null,
): CandidateAiState => {
  if (httpStatus === 200 && data) {
    if (data.status === 'COMPLETED') {
      return {
        ...state,
        submissionState: 'completed',
        completedInteraction: {
          prompt: state.prompt.trim(),
          responseText: data.responseText ?? '',
        },
        errorMessage: null,
      };
    }

    if (
      data.terminalReason === 'AMBIGUOUS_DISPATCH' ||
      data.status === 'DISPATCH_STARTED'
    ) {
      return {
        ...state,
        submissionState: 'ambiguous',
        errorMessage:
          'This request was already submitted, but Delimit cannot safely determine whether the provider completed it. Start a new request if you want to try again.',
      };
    }

    if (data.terminalReason === 'TIMEOUT') {
      return {
        ...state,
        submissionState: 'failed',
        errorMessage: 'The AI request timed out.',
      };
    }

    return {
      ...state,
      submissionState: 'failed',
      errorMessage: 'The AI provider returned an error.',
    };
  }

  // Non-200 HTTP responses
  if (httpStatus === 409 && data?.error?.code === 'AMBIGUOUS_DISPATCH') {
    return {
      ...state,
      submissionState: 'ambiguous',
      errorMessage:
        'This request was already submitted, but Delimit cannot safely determine whether the provider completed it. Start a new request if you want to try again.',
    };
  }

  if (httpStatus === 409 && data?.error?.code === 'AI_NOT_ENABLED') {
    return {
      ...state,
      submissionState: 'failed',
      errorMessage:
        'Integrated AI assistance is not enabled for this assessment.',
    };
  }

  if (
    httpStatus === 400 &&
    data?.error?.message?.toLowerCase().includes('context')
  ) {
    return {
      ...state,
      submissionState: 'failed',
      errorMessage: 'One or more selected context files could not be included.',
    };
  }

  return {
    ...state,
    submissionState: 'failed',
    errorMessage: 'The AI provider returned an error.',
  };
};

export const resolveSubmissionNetworkError = (
  state: CandidateAiState,
): CandidateAiState => ({
  ...state,
  submissionState: 'failed',
  errorMessage: 'The AI provider returned an error.',
});

export const buildAiInteractionPayload = (
  state: CandidateAiState,
  requestId: string,
) => ({
  clientRequestId: requestId,
  candidatePromptText: state.prompt.trim(),
  candidateContext:
    state.selectedContext.length > 0 ? state.selectedContext : undefined,
});
