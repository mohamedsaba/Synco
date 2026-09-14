import { errorResponse } from '../../../../../../src/http/error-response';
import { toCandidateSessionView } from '../../../../../../src/sessions/candidate-session-view';
import { getSessionService } from '../../../../../../src/sessions/session-service';

type CandidateRouteContext = Readonly<{
  params: Promise<{ token: string }>;
}>;

export const PUT = async (request: Request, context: CandidateRouteContext) => {
  try {
    const body = (await request.json()) as { content?: unknown };
    if (typeof body.content !== 'string') {
      return Response.json(
        {
          error: {
            code: 'INVALID_CONTENT',
            message: 'File content must be a string.',
          },
        },
        { status: 400 },
      );
    }

    const { token } = await context.params;
    const session = getSessionService().save(token, body.content);
    return Response.json(toCandidateSessionView(session));
  } catch (error) {
    return errorResponse(error);
  }
};
