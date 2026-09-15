import { cookies } from 'next/headers';

import { evaluatorCookieName } from '../../../../../../src/access/evaluator-access';
import { errorResponse } from '../../../../../../src/http/error-response';
import {
  ensureAuthorizedReconstruction,
  getAuthorizedReconstruction,
} from '../../../../../../src/reconstruction/evidence-reconstruction-runtime';

type EvaluatorRouteContext = Readonly<{
  params: Promise<{ sessionId: string }>;
}>;

const requestContext = async (context: EvaluatorRouteContext) => {
  const [{ sessionId }, cookieStore] = await Promise.all([
    context.params,
    cookies(),
  ]);
  return {
    sessionId,
    evaluatorCookie: cookieStore.get(evaluatorCookieName)?.value,
  };
};

export const GET = async (
  _request: Request,
  context: EvaluatorRouteContext,
) => {
  try {
    const { sessionId, evaluatorCookie } = await requestContext(context);
    return Response.json(
      getAuthorizedReconstruction(sessionId, evaluatorCookie),
    );
  } catch (error) {
    return errorResponse(error);
  }
};

export const POST = async (
  request: Request,
  context: EvaluatorRouteContext,
) => {
  try {
    const { sessionId, evaluatorCookie } = await requestContext(context);
    const rawBody = await request.text();
    let body: { retryFailed?: unknown } = {};
    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Invalid body shape.');
        }
        body = parsed as { retryFailed?: unknown };
      } catch {
        return Response.json(
          {
            error: {
              code: 'INVALID_RECONSTRUCTION_REQUEST',
              message: 'The request body must be a JSON object.',
            },
          },
          { status: 400 },
        );
      }
    }
    if (
      Object.keys(body).some((key) => key !== 'retryFailed') ||
      (body.retryFailed !== undefined && typeof body.retryFailed !== 'boolean')
    ) {
      return Response.json(
        {
          error: {
            code: 'INVALID_RECONSTRUCTION_REQUEST',
            message: 'Only the retryFailed boolean is accepted.',
          },
        },
        { status: 400 },
      );
    }
    const retryFailed = body.retryFailed === true;
    const reconstruction = await ensureAuthorizedReconstruction(
      sessionId,
      evaluatorCookie,
      retryFailed,
    );
    const status =
      reconstruction.status === 'PENDING'
        ? 202
        : reconstruction.status === 'FAILED'
          ? 503
          : 200;
    return Response.json(reconstruction, { status });
  } catch (error) {
    return errorResponse(error);
  }
};
