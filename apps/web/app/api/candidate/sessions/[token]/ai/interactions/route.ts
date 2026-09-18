import type { CandidateContextAttachment } from '../../../../../../../src/ai/ai-interaction';
import { getAiInteractionService } from '../../../../../../../src/ai/ai-interaction-service';
import { errorResponse } from '../../../../../../../src/http/error-response';
import { getSessionService } from '../../../../../../../src/sessions/session-service';

type CandidateRouteContext = Readonly<{
  params: Promise<{ token: string }>;
}>;

type AiInteractionRequestBody = Readonly<{
  clientRequestId?: unknown;
  candidatePromptText?: unknown;
  candidateInput?: unknown;
  candidateContext?: readonly CandidateContextAttachment[];
}>;

export const POST = async (
  request: Request,
  context: CandidateRouteContext,
) => {
  try {
    const [{ token }, body] = await Promise.all([
      context.params,
      request.json() as Promise<AiInteractionRequestBody>,
    ]);

    const sessionService = getSessionService();
    const session = sessionService.getCandidateSession(token);

    const clientRequestId =
      typeof body?.clientRequestId === 'string'
        ? body.clientRequestId.trim()
        : '';
    if (!clientRequestId) {
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'clientRequestId is required.',
          },
        },
        { status: 400 },
      );
    }

    const rawPrompt = body?.candidatePromptText ?? body?.candidateInput;
    const candidatePromptText = typeof rawPrompt === 'string' ? rawPrompt : '';
    if (!candidatePromptText || candidatePromptText.trim().length === 0) {
      return Response.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'candidatePromptText (or candidateInput) cannot be empty.',
          },
        },
        { status: 400 },
      );
    }

    const delimitContext = {
      scenarioId: session.scenario.id,
      scenarioVersion: session.scenario.version,
      configurationVersion:
        session.aiCapabilitySnapshot?.configurationVersion ?? '1.0.0',
    };

    const aiService = getAiInteractionService();
    const result = await aiService.executeInteraction(session.id, {
      clientRequestId,
      candidatePromptText,
      candidateContext: body?.candidateContext,
      delimitContext,
    });

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
};
