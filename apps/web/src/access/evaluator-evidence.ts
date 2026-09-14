import { isEvaluatorCookieValid } from './evaluator-access';
import {
  getSessionService,
  type SessionService,
} from '../sessions/session-service';

export class EvaluatorAccessError extends Error {
  constructor() {
    super('Evaluator access is required.');
    this.name = 'EvaluatorAccessError';
  }
}

export const getAuthorizedEvidence = (
  sessionId: string,
  evaluatorCookie: string | undefined,
  options: Readonly<{
    credential?: string;
    service?: SessionService;
  }> = {},
) => {
  if (!isEvaluatorCookieValid(evaluatorCookie, options.credential)) {
    throw new EvaluatorAccessError();
  }

  return (options.service ?? getSessionService()).getSubmittedEvidence(
    sessionId,
  );
};
