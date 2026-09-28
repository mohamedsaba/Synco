import { NextResponse } from 'next/server';

import {
  createEvaluatorCookieValue,
  evaluatorCookieName,
  isEvaluatorCredentialValid,
} from '../../../../src/access/evaluator-access';

export const POST = async (request: Request) => {
  const body = (await request.json()) as { credential?: unknown };
  if (!process.env.HIREARCHY_EVALUATOR_KEY) {
    return Response.json(
      {
        error: {
          code: 'EVALUATOR_NOT_CONFIGURED',
          message:
            'Set HIREARCHY_EVALUATOR_KEY before opening evidence review.',
        },
      },
      { status: 503 },
    );
  }

  if (
    typeof body.credential !== 'string' ||
    !isEvaluatorCredentialValid(body.credential)
  ) {
    return Response.json(
      {
        error: {
          code: 'INVALID_EVALUATOR_CREDENTIAL',
          message: 'The evaluator credential is not valid.',
        },
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set({
    name: evaluatorCookieName,
    value: createEvaluatorCookieValue(body.credential),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
};
