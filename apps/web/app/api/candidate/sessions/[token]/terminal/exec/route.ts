import { errorResponse } from '../../../../../../../src/http/error-response';
import { MAX_COMMAND_LENGTH } from '../../../../../../../src/sandbox/sandbox';
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

    const rawCommand = typeof body?.command === 'string' ? body.command : '';
    const command = rawCommand.trim();
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

    if (command.length > MAX_COMMAND_LENGTH) {
      return Response.json(
        {
          error: {
            code: 'COMMAND_TOO_LARGE',
            message: `Command exceeds the maximum limit of ${MAX_COMMAND_LENGTH} characters.`,
          },
        },
        { status: 413 },
      );
    }

    const result = await getSessionService().executeCommand(token, command);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
};
