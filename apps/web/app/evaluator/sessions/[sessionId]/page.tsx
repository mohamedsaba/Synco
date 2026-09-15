import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { evaluatorCookieName } from '../../../../src/access/evaluator-access';
import {
  EvaluatorAccessError,
  getAuthorizedEvidence,
} from '../../../../src/access/evaluator-evidence';
import { buildChronologicalReconstruction } from '../../../../src/evidence/chronological-reconstruction';
import type { SessionEvent } from '../../../../src/events/session-event';
import { getAuthorizedReconstruction } from '../../../../src/reconstruction/evidence-reconstruction-runtime';
import { buildEvidenceReferenceCatalog } from '../../../../src/reconstruction/evidence-reference-catalog';
import { SessionError } from '../../../../src/sessions/session';
import { EvidenceItemCard } from './evidence-item-card';
import { ReconstructionPanel } from './reconstruction-panel';

export const dynamic = 'force-dynamic';

type EvidencePageProps = Readonly<{
  params: Promise<{ sessionId: string }>;
}>;

const EvidencePage = async ({ params }: EvidencePageProps) => {
  const [{ sessionId }, cookieStore] = await Promise.all([params, cookies()]);
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
        <section className="access-card">
          <p className="eyebrow">Evidence review</p>
          <h1>Submission not available.</h1>
          <p className="brief-copy">
            Evidence remains unavailable until the server freezes the candidate
            workspace.
          </p>
          <Link className="text-link" href="/evaluator">
            Review another session
          </Link>
        </section>
      </main>
    );
  }

  const events = (evidence.events ?? []) as readonly SessionEvent[];
  const chronology = buildChronologicalReconstruction(
    {
      activatedAt: evidence.activatedAt ?? null,
      submittedAt: evidence.submittedAt,
      submittedDiff: evidence.diff,
    },
    events,
  );
  const catalog = buildEvidenceReferenceCatalog(sessionId, chronology);
  const reconstruction = getAuthorizedReconstruction(
    sessionId,
    evaluatorCookie,
  );
  const commandCount = chronology.filter(
    (item) => item.kind === 'COMMAND_EXECUTION',
  ).length;
  const workspaceChangeCount = chronology.filter(
    (item) => item.kind === 'WORKSPACE_CHANGE',
  ).length;
  const gapCount = chronology.filter(
    (item) => item.kind === 'WORKSPACE_GAP',
  ).length;
  const outOfBandCount = chronology.filter(
    (item) => item.kind === 'WORKSPACE_CHANGE' && item.origin === 'out_of_band',
  ).length;

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
        <div>
          <dt>Raw events</dt>
          <dd>{events.length} captured</dd>
        </div>
        <div>
          <dt>Commands</dt>
          <dd>{commandCount} executed</dd>
        </div>
        <div>
          <dt>Workspace changes</dt>
          <dd>{workspaceChangeCount} recorded</dd>
        </div>
      </dl>

      <ReconstructionPanel
        entries={catalog.entries}
        initial={reconstruction}
        integrity={{ gapCount, outOfBandCount }}
        sessionId={sessionId}
        submittedDiff={evidence.diff}
      />

      <details className="evidence-section" aria-labelledby="timeline-title">
        <summary className="section-heading">
          <p className="section-number">02</p>
          <div>
            <h2 id="timeline-title">Technical chronology</h2>
            <p>
              Complete deterministic history, with raw evidence available for
              every recorded item.
            </p>
          </div>
        </summary>
        {chronology.length === 0 ? (
          <div className="capture-note">No actions were captured.</div>
        ) : (
          <div className="timeline-list">
            {chronology.map((item, index) => (
              <EvidenceItemCard
                item={item}
                key={`${item.kind}-${'sequence' in item ? item.sequence : index}`}
              />
            ))}
          </div>
        )}
      </details>

      <details className="evidence-section" aria-labelledby="diff-title">
        <summary className="section-heading">
          <p className="section-number">03</p>
          <div>
            <h2 id="diff-title">Final submitted diff</h2>
            <p>
              Complete server-derived diff against the immutable Delimit
              baseline.
            </p>
          </div>
        </summary>
        <pre className="diff-block">{evidence.diff}</pre>
      </details>

      {evidence.scenarioType !== 'multi_file' && evidence.scenario.filePath ? (
        <div className="source-grid">
          <section className="evidence-section">
            <div className="section-heading compact">
              <p className="section-number">04</p>
              <h2>Original file</h2>
            </div>
            <p className="code-path">{evidence.scenario.filePath}</p>
            <pre className="source-block">{evidence.originalContent}</pre>
          </section>
          <section className="evidence-section">
            <div className="section-heading compact">
              <p className="section-number">05</p>
              <h2>Submitted file</h2>
            </div>
            <p className="code-path">{evidence.scenario.filePath}</p>
            <pre className="source-block">{evidence.submittedContent}</pre>
          </section>
        </div>
      ) : null}
    </main>
  );
};

export default EvidencePage;
