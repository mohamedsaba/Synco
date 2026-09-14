import { errorResponse } from '../../../../../../../src/http/error-response';
import { getSessionService } from '../../../../../../../src/sessions/session-service';

type TerminalRouteContext = Readonly<{
  params: Promise<{ token: string }>;
}>;

type CommandRequestBody = Readonly<{
  command?: string;
}>;

export const POST = async (request: Request, context: TerminalRouteContext) => {
  try {
    const [{ token }, body] = await Promise.all([
      context.params,
      request.json() as Promise<CommandRequestBody>,
    ]);

    const command =
      typeof body?.command === 'string' ? body.command.trim() : '';
    if (!command) {
      return Response.json(
        {
          error: {
            code: 'INVALID_COMMAND',
            message: 'A non-empty command is required.',
          },
        },
        { status: 400 },
      );
    }

    const result = await getSessionService().executeCommand(token, command);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
};
