import { errorResponse } from '../../../../../../../src/http/error-response';
import { getSessionService } from '../../../../../../../src/sessions/session-service';

type CandidateRouteContext = Readonly<{
  params: Promise<{ token: string }>;
}>;

export const GET = async (request: Request, context: CandidateRouteContext) => {
  try {
    const { token } = await context.params;
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');
    if (!filePath) {
      return Response.json(
        {
          error: {
            code: 'INVALID_PATH',
            message: 'A file path must be specified via ?path=...',
          },
        },
        { status: 400 },
      );
    }
    const content = await getSessionService().readWorkspaceFile(
      token,
      filePath,
    );
    return Response.json({ path: filePath, content });
  } catch (error) {
    return errorResponse(error);
  }
};

export const PUT = async (request: Request, context: CandidateRouteContext) => {
  try {
    const body = (await request.json()) as {
      path?: unknown;
      content?: unknown;
    };
    if (typeof body.path !== 'string' || !body.path.trim()) {
      return Response.json(
        {
          error: {
            code: 'INVALID_PATH',
            message: 'File path must be a non-empty string.',
          },
        },
        { status: 400 },
      );
    }
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
    const result = await getSessionService().saveWorkspaceFile(
      token,
      body.path,
      body.content,
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
};
