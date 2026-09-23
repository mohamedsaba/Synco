import { getSessionService } from '../../../src/sessions/session-service';
import { getIssuableScenario } from '../../../src/scenarios/issuable-scenarios';

export const POST = async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: 'INVALID_SESSION_REQUEST',
          message: 'The session request must contain valid JSON.',
        },
      },
      { status: 400 },
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json(
      {
        error: {
          code: 'INVALID_SESSION_REQUEST',
          message: 'The session request must be an object.',
        },
      },
      { status: 400 },
    );
  }

  const { scenarioId } = body as { scenarioId?: unknown };
  if (scenarioId === undefined || scenarioId === null || scenarioId === '') {
    return Response.json(
      {
        error: {
          code: 'MISSING_SCENARIO_ID',
          message: 'A scenario ID is required to create a session.',
        },
      },
      { status: 400 },
    );
  }

  if (typeof scenarioId !== 'string' || !scenarioId.trim()) {
    return Response.json(
      {
        error: {
          code: 'INVALID_SCENARIO_ID',
          message: 'The scenario ID must be a non-empty string.',
        },
      },
      { status: 400 },
    );
  }

  const scenario = getIssuableScenario(scenarioId);
  if (!scenario) {
    return Response.json(
      {
        error: {
          code: 'UNSUPPORTED_SCENARIO',
          message: 'The requested scenario is not available.',
        },
      },
      { status: 404 },
    );
  }

  const { candidateToken, session } = getSessionService().createSession({
    scenario,
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
