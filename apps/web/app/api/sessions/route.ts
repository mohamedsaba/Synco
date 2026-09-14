import { getSessionService } from '../../../src/sessions/session-service';

export const POST = () => {
  const { candidateToken, session } = getSessionService().createSession();

  return Response.json(
    {
      sessionId: session.id,
      candidatePath: `/candidate/${candidateToken}`,
    },
    { status: 201 },
  );
};
