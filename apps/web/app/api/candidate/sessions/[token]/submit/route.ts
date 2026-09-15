import { after } from 'next/server';

import { errorResponse } from '../../../../../../src/http/error-response';
import { ensurePostSubmissionReconstruction } from '../../../../../../src/reconstruction/evidence-reconstruction-runtime';
import { toCandidateSessionView } from '../../../../../../src/sessions/candidate-session-view';
import { getSessionService } from '../../../../../../src/sessions/session-service';

type CandidateRouteContext = Readonly<{
  params: Promise<{ token: string }>;
}>;

export const POST = async (
  _request: Request,
  context: CandidateRouteContext,
) => {
  try {
    const { token } = await context.params;
    const session = await getSessionService().submit(token);
    after(async () => {
      await ensurePostSubmissionReconstruction(session.id);
    });
    return Response.json(toCandidateSessionView(session));
  } catch (error) {
    return errorResponse(error);
  }
};
