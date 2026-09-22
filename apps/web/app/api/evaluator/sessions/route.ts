import { cookies } from 'next/headers';

import { evaluatorCookieName } from '../../../../src/access/evaluator-access';
import { getAuthorizedReviewQueue } from '../../../../src/access/evaluator-evidence';
import { errorResponse } from '../../../../src/http/error-response';

export const GET = async () => {
  try {
    const cookieStore = await cookies();
    return Response.json(
      getAuthorizedReviewQueue(cookieStore.get(evaluatorCookieName)?.value),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
};
