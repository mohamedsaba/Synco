import { getSessionService } from '../../../src/sessions/session-service';

export const POST = async (request: Request) => {
  let body: { scenarioId?: string } | undefined;
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const { candidateToken, session } = getSessionService().createSession({
    scenarioId: body?.scenarioId,
  });

  return Response.json(
    {
      sessionId: session.id,
      candidatePath: `/candidate/${candidateToken}`,
      scenarioId: session.scenario.id,
    },
    { status: 201 },
  );
};
