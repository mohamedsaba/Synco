import { cookies } from 'next/headers';

import { evaluatorCookieName } from '../../../../../src/access/evaluator-access';
import { getAuthorizedEvidence } from '../../../../../src/access/evaluator-evidence';
import { errorResponse } from '../../../../../src/http/error-response';

type EvaluatorRouteContext = Readonly<{
  params: Promise<{ sessionId: string }>;
}>;

export const GET = async (
  _request: Request,
  context: EvaluatorRouteContext,
) => {
  try {
    const [{ sessionId }, cookieStore] = await Promise.all([
      context.params,
      cookies(),
    ]);
    const evidence = getAuthorizedEvidence(
      sessionId,
      cookieStore.get(evaluatorCookieName)?.value,
    );
    return Response.json(evidence);
  } catch (error) {
    return errorResponse(error);
  }
};
