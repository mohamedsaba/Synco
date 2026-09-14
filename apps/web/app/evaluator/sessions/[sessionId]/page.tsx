import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { evaluatorCookieName } from '../../../../src/access/evaluator-access';
import {
  EvaluatorAccessError,
  getAuthorizedEvidence,
} from '../../../../src/access/evaluator-evidence';
import type {
  CommandFinishedPayload,
  CommandStartedPayload,
  SessionEvent,
} from '../../../../src/events/session-event';
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

  const events = (evidence.events ?? []) as readonly SessionEvent[];

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

      {evidence.scenarioType !== 'multi_file' && evidence.scenario.filePath ? (
        <div className="source-grid">
          <section
            className="evidence-section"
            aria-labelledby="original-title"
          >
            <div className="section-heading compact">
              <p className="section-number">02</p>
              <h2 id="original-title">Original file</h2>
            </div>
            <p className="code-path">{evidence.scenario.filePath}</p>
            <pre className="source-block">{evidence.originalContent}</pre>
          </section>
          <section
            className="evidence-section"
            aria-labelledby="submitted-title"
          >
            <div className="section-heading compact">
              <p className="section-number">03</p>
              <h2 id="submitted-title">Submitted file</h2>
            </div>
            <p className="code-path">{evidence.scenario.filePath}</p>
            <pre className="source-block">{evidence.submittedContent}</pre>
          </section>
        </div>
      ) : null}

      {/* Chronological raw command evidence */}
      <section className="evidence-section" aria-labelledby="events-title">
        <div className="section-heading">
          <p className="section-number">
            {evidence.scenarioType === 'multi_file' ? '02' : '04'}
          </p>
          <div>
            <h2 id="events-title">Chronological raw command evidence</h2>
            <p>
              Authoritative append-only events captured by the server runtime.
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="capture-note" style={{ margin: '1.5rem' }}>
            No terminal commands were executed during this session.
          </div>
        ) : (
          <div className="raw-events-list">
            {events.map((event) => {
              if (event.type === 'COMMAND_STARTED') {
                const payload = event.payload as CommandStartedPayload;
                return (
                  <article className="event-card" key={event.id}>
                    <div className="event-card-header">
                      <div className="event-card-title">
                        <span className="event-seq">#{event.sequence}</span>
                        <span className="event-type">COMMAND_STARTED</span>
                        <span className="file-kicker">cwd: {payload.cwd}</span>
                      </div>
                      <time className="event-time" dateTime={event.timestamp}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </time>
                    </div>
                    <div className="command-meta">
                      <span className="command-text">$ {payload.command}</span>
                      <span className="file-kicker">
                        id: {payload.commandId}
                      </span>
                    </div>
                  </article>
                );
              }

              if (event.type === 'COMMAND_FINISHED') {
                const payload = event.payload as CommandFinishedPayload;
                return (
                  <article className="event-card" key={event.id}>
                    <div className="event-card-header">
                      <div className="event-card-title">
                        <span className="event-seq">#{event.sequence}</span>
                        <span className="event-type">COMMAND_FINISHED</span>
                        {payload.timedOut ? (
                          <span className="badge badge-timeout">Timed out</span>
                        ) : payload.exitCode === 0 ? (
                          <span className="badge badge-success">
                            Exit {payload.exitCode}
                          </span>
                        ) : (
                          <span className="badge badge-error">
                            Exit {payload.exitCode}
                          </span>
                        )}
                        <span>{payload.durationMs}ms</span>
                        {payload.stdoutTruncated ? (
                          <span className="badge badge-truncated">
                            stdout truncated ({payload.stdoutBytes} B total)
                          </span>
                        ) : null}
                        {payload.stderrTruncated ? (
                          <span className="badge badge-truncated">
                            stderr truncated ({payload.stderrBytes} B total)
                          </span>
                        ) : null}
                      </div>
                      <time className="event-time" dateTime={event.timestamp}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </time>
                    </div>
                    <div className="command-meta">
                      <span className="file-kicker">
                        id: {payload.commandId}
                      </span>
                    </div>
                    {payload.stdoutPreview ? (
                      <pre className="command-output">
                        {payload.stdoutPreview}
                      </pre>
                    ) : null}
                    {payload.stderrPreview ? (
                      <pre className="command-output stderr">
                        {payload.stderrPreview}
                      </pre>
                    ) : null}
                  </article>
                );
              }

              return null;
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default EvidencePage;
