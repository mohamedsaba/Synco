import { errorResponse } from '../../../../../../../src/http/error-response';
import { getSessionService } from '../../../../../../../src/sessions/session-service';

type CandidateRouteContext = Readonly<{
  params: Promise<{ token: string }>;
}>;

export const GET = async (
  _request: Request,
  context: CandidateRouteContext,
) => {
  try {
    const { token } = await context.params;
    const files = await getSessionService().listWorkspaceFiles(token);
    return Response.json({ files });
  } catch (error) {
    return errorResponse(error);
  }
};
