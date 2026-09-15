import { EvaluatorAccessError } from '../access/evaluator-evidence';
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

export const errorResponse = (error: unknown) => {
  if (error instanceof SessionError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: sessionStatus[error.code] },
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
