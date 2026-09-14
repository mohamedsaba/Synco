import { errorResponse } from '../../../../../src/http/error-response';
import { toCandidateSessionView } from '../../../../../src/sessions/candidate-session-view';
import { getSessionService } from '../../../../../src/sessions/session-service';

type CandidateRouteContext = Readonly<{
  params: Promise<{ token: string }>;
}>;

export const GET = async (
  _request: Request,
  context: CandidateRouteContext,
) => {
  try {
    const { token } = await context.params;
    const session = getSessionService().getCandidateSession(token);
    return Response.json(toCandidateSessionView(session));
  } catch (error) {
    return errorResponse(error);
  }
};
