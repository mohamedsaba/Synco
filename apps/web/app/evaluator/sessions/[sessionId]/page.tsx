import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { evaluatorCookieName } from '../../../../src/access/evaluator-access';
import {
  EvaluatorAccessError,
  getAuthorizedEvidence,
} from '../../../../src/access/evaluator-evidence';
import { buildEvaluatorReviewPresentation } from '../../../../src/evaluator/evaluator-review-presentation';
import { getAuthorizedReconstruction } from '../../../../src/reconstruction/evidence-reconstruction-runtime';
import { SessionError } from '../../../../src/sessions/session';
import { buildEvaluatorBriefing } from '../../../../src/evaluator/build-evaluator-briefing';
import {
  briefingDepthProfiles,
  projectBriefing,
  type BriefingDepthProfile,
} from '../../../../src/evaluator/project-evaluator-briefing';
import { submittedChangesAnchor } from './submitted-diff';
import { EvaluatorExperience } from './evaluator-experience';

export { submittedChangesAnchor };
export const dynamic = 'force-dynamic';

type EvidencePageProps = Readonly<{
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<{ depth?: string; role?: string }>;
}>;

const EvidencePage = async ({ params, searchParams }: EvidencePageProps) => {
  const [{ sessionId }, cookieStore, resolvedSearchParams] = await Promise.all([
    params,
    cookies(),
    searchParams
      ? searchParams
      : Promise.resolve({} as { depth?: string; role?: string }),
  ]);

  const evaluatorCookie = cookieStore.get(evaluatorCookieName)?.value;
  let evidence: ReturnType<typeof getAuthorizedEvidence> | null = null;

  try {
    evidence = getAuthorizedEvidence(sessionId, evaluatorCookie);
  } catch (error) {
    if (error instanceof EvaluatorAccessError) redirect('/evaluator');
    if (error instanceof SessionError && error.code === 'SESSION_NOT_FOUND') {
      notFound();
    }
    if (error instanceof SessionError && error.code === 'EVIDENCE_NOT_READY') {
      evidence = null;
    } else {
      throw error;
    }
  }

  if (!evidence) {
    return (
      <main className="access-shell">
        <section className="access-card" aria-labelledby="not-ready-title">
          <p className="eyebrow">Evidence review</p>
          <h1 id="not-ready-title">Submission not available.</h1>
          <p className="brief-copy">
            The session remains unavailable until the submitted workspace has
            been frozen.
          </p>
          <Link className="text-link" href="/evaluator">
            Review another session
          </Link>
        </section>
      </main>
    );
  }

  const reconstruction = getAuthorizedReconstruction(
    sessionId,
    evaluatorCookie,
  );
  const briefing = buildEvaluatorBriefing(evidence, reconstruction);
  const review = buildEvaluatorReviewPresentation(evidence, reconstruction);

  const requestedRole =
    resolvedSearchParams?.depth || resolvedSearchParams?.role;
  const activeRole: BriefingDepthProfile =
    requestedRole &&
    briefingDepthProfiles.includes(requestedRole as BriefingDepthProfile)
      ? (requestedRole as BriefingDepthProfile)
      : 'GENERALIST_RECRUITER';

  const projection = projectBriefing(briefing, activeRole);

  return (
    <main className="evaluator-review-shell" id={submittedChangesAnchor}>
      <EvaluatorExperience
        sessionId={sessionId}
        evidence={evidence}
        review={review}
        projection={projection}
        activeRole={activeRole}
      />
    </main>
  );
};

export default EvidencePage;
