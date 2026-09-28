import {
  type CandidateContextAttachment,
  MAXIMUM_PROMPT_LENGTH,
} from '../../../src/ai/ai-interaction';

export type SubmissionState =
  'idle' | 'submitting' | 'completed' | 'failed' | 'ambiguous';

export type CandidateAiConversationEntry = Readonly<{
  requestId: string;
  prompt: string;
  context: readonly CandidateContextAttachment[];
  status: Exclude<SubmissionState, 'idle'>;
  responseText?: string;
  errorMessage?: string;
}>;

export type CandidateAiState = Readonly<{
  prompt: string;
  conversation: readonly CandidateAiConversationEntry[];
  submissionState: SubmissionState;
  clientRequestId: string | null;
  errorMessage: string | null;
}>;

export const INITIAL_CANDIDATE_AI_STATE: CandidateAiState = {
  prompt: '',
  conversation: [],
  submissionState: 'idle',
  clientRequestId: null,
  errorMessage: null,
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
): CandidateAiState => ({ ...state, prompt });

export const startNewRequest = (state: CandidateAiState): CandidateAiState => ({
  ...state,
  prompt: '',
  submissionState: 'idle',
  clientRequestId: null,
  errorMessage: null,
});

export const retryRequest = (state: CandidateAiState): CandidateAiState => ({
  ...state,
  submissionState: 'idle',
  clientRequestId: null,
  errorMessage: null,
});

export const beginSubmission = (
  state: CandidateAiState,
  context: readonly CandidateContextAttachment[],
  forcedRequestId?: string,
): { nextState: CandidateAiState; requestId: string } | null => {
  if (state.submissionState === 'submitting') return null;

  const prompt = state.prompt.trim();
  if (!prompt) return null;

  const requestId =
    forcedRequestId ?? state.clientRequestId ?? generateClientRequestId();

  return {
    requestId,
    nextState: {
      ...state,
      conversation: [
        ...state.conversation,
        { requestId, prompt, context, status: 'submitting' },
      ],
      submissionState: 'submitting',
      clientRequestId: requestId,
      errorMessage: null,
    },
  };
};

export type ServerInteractionResponse = Readonly<{
  status?: string;
  terminalReason?: string | null;
  responseText?: string | null;
  interactionId?: string;
  error?: { code?: string; message?: string };
}>;

const updateCurrentEntry = (
  state: CandidateAiState,
  entry: Omit<CandidateAiConversationEntry, 'requestId' | 'prompt' | 'context'>,
): CandidateAiState => ({
  ...state,
  conversation: state.conversation.map((item) =>
    item.requestId === state.clientRequestId ? { ...item, ...entry } : item,
  ),
});

const fail = (
  state: CandidateAiState,
  errorMessage: string,
  status: 'failed' | 'ambiguous' = 'failed',
): CandidateAiState => {
  const nextState = updateCurrentEntry(state, { status, errorMessage });
  return { ...nextState, submissionState: status, errorMessage };
};

export const resolveSubmissionResult = (
  state: CandidateAiState,
  httpStatus: number,
  data: ServerInteractionResponse | null,
): CandidateAiState => {
  if (httpStatus === 200 && data?.status === 'COMPLETED') {
    if (typeof data.responseText !== 'string') {
      return fail(
        state,
        'Hirearchy Software received an incomplete AI result. Try again.',
      );
    }
    const nextState = updateCurrentEntry(state, {
      status: 'completed',
      responseText: data.responseText,
    });
    return { ...nextState, submissionState: 'completed', errorMessage: null };
  }

  if (
    data?.terminalReason === 'AMBIGUOUS_DISPATCH' ||
    data?.status === 'DISPATCH_STARTED' ||
    data?.error?.code === 'AMBIGUOUS_DISPATCH'
  ) {
    return fail(
      state,
      'This request may already be in progress. Hirearchy Software will not send it again automatically.',
      'ambiguous',
    );
  }

  if (data?.terminalReason === 'session_ended') {
    return fail(
      state,
      'AI is unavailable because the assessment is no longer active.',
    );
  }

  if (data?.terminalReason === 'TIMEOUT') {
    return fail(
      state,
      'The AI request timed out. Try again while the assessment is active.',
    );
  }

  if (data?.error?.code === 'SESSION_DEADLINE_EXCEEDED') {
    return fail(
      state,
      'The assessment time limit has been reached. AI is unavailable.',
    );
  }

  if (data?.error?.code === 'SESSION_NOT_ACTIVE') {
    return fail(
      state,
      'AI is unavailable because the assessment is no longer active.',
    );
  }

  if (data?.error?.code === 'SESSION_FINALIZATION_STARTED') {
    return fail(state, 'AI is unavailable because finalization has started.');
  }

  if (data?.error?.code === 'AI_NOT_ENABLED') {
    return fail(
      state,
      'Integrated AI assistance is not enabled for this assessment.',
    );
  }

  if (
    httpStatus === 400 &&
    data?.error?.message?.toLowerCase().includes('context')
  ) {
    return fail(state, 'The current file context could not be included.');
  }

  return fail(state, 'AI could not respond. Try again.');
};

export const resolveSubmissionNetworkError = (
  state: CandidateAiState,
): CandidateAiState =>
  fail(state, 'Hirearchy Software could not reach AI. Try again.');

export const buildAiInteractionPayload = (
  state: CandidateAiState,
  requestId: string,
  context: readonly CandidateContextAttachment[],
) => ({
  clientRequestId: requestId,
  candidatePromptText: state.prompt.trim(),
  candidateContext: context.length > 0 ? context : undefined,
});
