import { notFound } from 'next/navigation';

import { SessionError } from '../../../src/sessions/session';
import { getSessionService } from '../../../src/sessions/session-service';
import { toCandidateSessionView } from '../../../src/sessions/candidate-session-view';
import { CandidateWorkspace } from './candidate-workspace';

export const dynamic = 'force-dynamic';

type CandidatePageProps = Readonly<{
  params: Promise<{ token: string }>;
}>;

const CandidatePage = async ({ params }: CandidatePageProps) => {
  const { token } = await params;
  let session;

  try {
    session = getSessionService().getCandidateSession(token);
  } catch (error) {
    if (error instanceof SessionError && error.code === 'SESSION_NOT_FOUND') {
      notFound();
    }

    throw error;
  }

  return (
    <CandidateWorkspace
      initialSession={toCandidateSessionView(session)}
      token={token}
    />
  );
};

export default CandidatePage;
