import { EvaluatorAccessError } from '../access/evaluator-evidence';
import { AiInteractionError } from '../ai/ai-interaction';
import { EvidenceReconstructionError } from '../reconstruction/evidence-reconstruction';
import { SandboxError } from '../sandbox/sandbox';
import { SessionError } from '../sessions/session';

const sessionStatus: Record<SessionError['code'], number> = {
  SESSION_NOT_FOUND: 404,
  SESSION_NOT_ACTIVE: 409,
  EVIDENCE_NOT_READY: 409,
  CONTENT_TOO_LARGE: 413,
  PLATFORM_CAPTURE_FAILED: 500,
};

const aiInteractionStatus: Record<AiInteractionError['code'], number> = {
  SESSION_NOT_FOUND: 404,
  SESSION_NOT_ACTIVE: 409,
  AI_NOT_ENABLED: 409,
  INVALID_INPUT: 400,
  INPUT_TOO_LARGE: 413,
  INVALID_STATE_TRANSITION: 409,
  INTERACTION_NOT_FOUND: 404,
  AMBIGUOUS_DISPATCH: 409,
  PROVIDER_NOT_CONFIGURED: 500,
  PLATFORM_PERSISTENCE_FAILED: 500,
};

export const errorResponse = (error: unknown) => {
  if (error instanceof SessionError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: sessionStatus[error.code] },
    );
  }

  if (error instanceof AiInteractionError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: aiInteractionStatus[error.code] ?? 400 },
    );
  }

  if (error instanceof SandboxError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: 503 },
    );
  }

  if (error instanceof EvaluatorAccessError) {
    return Response.json(
      { error: { code: 'EVALUATOR_ACCESS_REQUIRED', message: error.message } },
      { status: 401 },
    );
  }

  if (error instanceof EvidenceReconstructionError) {
    const status =
      error.code === 'PROVIDER_NOT_CONFIGURED' ||
      error.code === 'PROVIDER_UNAVAILABLE' ||
      error.code === 'PROVIDER_TIMEOUT' ||
      error.code === 'PROVIDER_RATE_LIMITED'
        ? 503
        : 422;
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status },
    );
  }

  console.error('Unexpected request failure', error);
  return Response.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The request could not be completed.',
      },
    },
    { status: 500 },
  );
};
