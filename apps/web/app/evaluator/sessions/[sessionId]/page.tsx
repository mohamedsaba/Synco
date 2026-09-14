import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { evaluatorCookieName } from '../../../../src/access/evaluator-access';
import {
  EvaluatorAccessError,
  getAuthorizedEvidence,
} from '../../../../src/access/evaluator-evidence';
import { SessionError } from '../../../../src/sessions/session';

export const dynamic = 'force-dynamic';

type EvidencePageProps = Readonly<{
  params: Promise<{ sessionId: string }>;
}>;

const EvidencePage = async ({ params }: EvidencePageProps) => {
  const [{ sessionId }, cookieStore] = await Promise.all([params, cookies()]);
  let evidence: ReturnType<typeof getAuthorizedEvidence> | null = null;

  try {
    evidence = getAuthorizedEvidence(
      sessionId,
      cookieStore.get(evaluatorCookieName)?.value,
    );
  } catch (error) {
    if (error instanceof EvaluatorAccessError) {
      redirect('/evaluator');
    }

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
        <section className="access-card">
          <p className="eyebrow">Evidence review</p>
          <h1>Submission not available.</h1>
          <p className="brief-copy">
            This session has not been submitted. Evidence remains unavailable
            until the server freezes the candidate file.
          </p>
          <Link className="text-link" href="/evaluator">
            Review another session
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="evidence-shell">
      <header className="evidence-header">
        <div>
          <p className="eyebrow">Evidence review</p>
          <h1>{evidence.scenario.title}</h1>
        </div>
        <Link className="text-link" href="/evaluator">
          Review another session
        </Link>
      </header>

      <dl className="metadata-strip">
        <div>
          <dt>Session</dt>
          <dd>{evidence.sessionId}</dd>
        </div>
        <div>
          <dt>Scenario</dt>
          <dd>
            {evidence.scenario.id} · v{evidence.scenario.version}
          </dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{new Date(evidence.submittedAt).toLocaleString()}</dd>
        </div>
      </dl>

      <section className="evidence-section" aria-labelledby="diff-title">
        <div className="section-heading">
          <p className="section-number">01</p>
          <div>
            <h2 id="diff-title">Deterministic unified diff</h2>
            <p>Generated on the server from immutable submitted evidence.</p>
          </div>
        </div>
        <pre className="diff-block">{evidence.diff}</pre>
      </section>

      <div className="source-grid">
        <section className="evidence-section" aria-labelledby="original-title">
          <div className="section-heading compact">
            <p className="section-number">02</p>
            <h2 id="original-title">Original file</h2>
          </div>
          <p className="code-path">{evidence.scenario.filePath}</p>
          <pre className="source-block">{evidence.originalContent}</pre>
        </section>
        <section className="evidence-section" aria-labelledby="submitted-title">
          <div className="section-heading compact">
            <p className="section-number">03</p>
            <h2 id="submitted-title">Submitted file</h2>
          </div>
          <p className="code-path">{evidence.scenario.filePath}</p>
          <pre className="source-block">{evidence.submittedContent}</pre>
        </section>
      </div>
    </main>
  );
};

export default EvidencePage;
