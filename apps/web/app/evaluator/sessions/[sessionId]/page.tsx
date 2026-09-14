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
  const reconstruction = buildChronologicalReconstruction(
    {
      activatedAt: evidence.activatedAt ?? null,
      submittedAt: evidence.submittedAt,
      submittedDiff: evidence.diff,
    },
    events,
  );

  const commandCount = reconstruction.filter(
    (i) => i.kind === 'COMMAND_EXECUTION',
  ).length;
  const workspaceChangeCount = reconstruction.filter(
    (i) => i.kind === 'WORKSPACE_CHANGE',
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

      {/* Section 01: Chronological Work History (Timeline) */}
      <section className="evidence-section" aria-labelledby="timeline-title">
        <div className="section-heading">
          <p className="section-number">01</p>
          <div>
            <h2 id="timeline-title">Chronological work history</h2>
            <p>
              Authoritative, deterministic timeline of candidate actions,
              command executions, and workspace mutations.
            </p>
          </div>
        </div>

        {reconstruction.length === 0 ? (
          <div className="capture-note" style={{ margin: '1.5rem' }}>
            No actions were captured during this session.
          </div>
        ) : (
          <div className="timeline-list">
            {reconstruction.map((item, idx) => {
              if (item.kind === 'SESSION_ACTIVATED') {
                return (
                  <div
                    className="timeline-marker-card activation-marker"
                    key={`act_${idx}`}
                  >
                    <div className="marker-content">
                      <div className="marker-dot" />
                      <span className="marker-title">Session Activated</span>
                      <span className="marker-desc">
                        Candidate workspace provisioned and ready.
                      </span>
                    </div>
                    <time className="event-time" dateTime={item.timestamp}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </time>
                  </div>
                );
              }

              if (item.kind === 'COMMAND_EXECUTION') {
                return (
                  <article
                    className="timeline-item-card command-card"
                    key={`cmd_${item.commandId}_${item.sequence}`}
                  >
                    <div className="timeline-item-header">
                      <div className="timeline-item-title">
                        <span className="event-seq">#{item.sequence}</span>
                        <span className="event-badge badge-command">
                          COMMAND
                        </span>
                        <span className="command-text">$ {item.command}</span>
                        {item.timedOut ? (
                          <span className="badge badge-timeout">Timed out</span>
                        ) : item.exitCode === 0 ? (
                          <span className="badge badge-success">Exit 0</span>
                        ) : (
                          <span className="badge badge-error">
                            Exit {item.exitCode}
                          </span>
                        )}
                        <span className="duration-pill">
                          {item.durationMs}ms
                        </span>
                      </div>
                      <time className="event-time" dateTime={item.finishedAt}>
                        {new Date(item.finishedAt).toLocaleTimeString()}
                      </time>
                    </div>
                    <div className="command-context-meta">
                      <span className="file-kicker">cwd: {item.cwd}</span>
                      <span className="file-kicker">id: {item.commandId}</span>
                    </div>
                    {item.stdoutPreview ? (
                      <div className="output-container">
                        <pre className="command-output">
                          {item.stdoutPreview}
                        </pre>
                      </div>
                    ) : null}
                    {item.stderrPreview ? (
                      <div className="output-container">
                        <pre className="command-output stderr">
                          {item.stderrPreview}
                        </pre>
                      </div>
                    ) : null}
                    <details className="raw-evidence-disclosure">
                      <summary>
                        Raw evidence envelope ({item.rawStartedEventId} ·{' '}
                        {item.rawFinishedEventId})
                      </summary>
                      <div className="raw-envelope-body">
                        {item.rawStartedEvent ? (
                          <div>
                            <strong>
                              Started (#{item.rawStartedEvent.sequence}):
                            </strong>
                            <pre className="raw-json-block">
                              {JSON.stringify(item.rawStartedEvent, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                        <div>
                          <strong>
                            Finished (#{item.rawFinishedEvent.sequence}):
                          </strong>
                          <pre className="raw-json-block">
                            {JSON.stringify(item.rawFinishedEvent, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </article>
                );
              }

              if (item.kind === 'WORKSPACE_CHANGE') {
                return (
                  <article
                    className="timeline-item-card change-card"
                    key={`chg_${item.changeId}_${item.sequence}`}
                  >
                    <div className="timeline-item-header">
                      <div className="timeline-item-title">
                        <span className="event-seq">#{item.sequence}</span>
                        <span className="event-badge badge-workspace">
                          WORKSPACE_CHANGED
                        </span>
                        <span
                          className={`origin-badge${item.origin === 'out_of_band' ? ' origin-out-of-band' : ''}`}
                        >
                          {item.origin === 'browser_save'
                            ? 'Browser editor save'
                            : item.origin === 'out_of_band'
                              ? 'Workspace changed between recorded actions'
                              : `Observed across command execution (${item.commandId})`}
                        </span>
                        <span className="stat-pill stat-add">
                          +{item.totalAdditions}
                        </span>
                        <span className="stat-pill stat-del">
                          -{item.totalDeletions}
                        </span>
                        <span
                          className="tree-pill"
                          title={`Transition: ${item.beforeTree} -> ${item.afterTree}`}
                        >
                          tree: {item.beforeTree.slice(0, 7)} →{' '}
                          {item.afterTree.slice(0, 7)}
                        </span>
                      </div>
                      <time className="event-time" dateTime={item.timestamp}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </time>
                    </div>
                    <div className="change-files-list">
                      {item.files.map((file) => (
                        <div key={file.path} className="change-file-item">
                          <div className="file-header-strip">
                            <span
                              className={`file-status-tag status-${file.status}`}
                            >
                              {file.status}
                            </span>
                            <span className="file-path-text">{file.path}</span>
                            <span className="file-diff-numbers">
                              +{file.additions} / -{file.deletions}
                            </span>
                          </div>
                          {file.patchTruncated ? (
                            <div className="truncation-alert">
                              Patch preview truncated — {file.patchPreviewBytes}{' '}
                              of {file.patchBytes} bytes retained. Intermediate
                              full patch not retained after session teardown.
                            </div>
                          ) : null}
                          {file.patchPreview ? (
                            <pre className="file-patch-block">
                              {file.patchPreview}
                            </pre>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <details className="raw-evidence-disclosure">
                      <summary>
                        Raw evidence envelope ({item.rawEventId})
                      </summary>
                      <div className="raw-envelope-body">
                        <pre className="raw-json-block">
                          {JSON.stringify(item.rawEvent, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </article>
                );
              }

              if (item.kind === 'WORKSPACE_GAP') {
                return (
                  <article
                    className="timeline-item-card gap-card"
                    key={`gap_${item.rawEventId}_${item.sequence}`}
                  >
                    <div className="timeline-item-header">
                      <div className="timeline-item-title">
                        <span className="event-seq">#{item.sequence}</span>
                        <span className="event-badge badge-gap">
                          WORKSPACE_GAP
                        </span>
                        <span className="gap-phase-tag">
                          Phase: {item.phase}
                        </span>
                        {item.commandId ? (
                          <span className="file-kicker">
                            command: {item.commandId}
                          </span>
                        ) : null}
                      </div>
                      <time className="event-time" dateTime={item.timestamp}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </time>
                    </div>
                    <div className="gap-body">
                      <p className="gap-alert-text">
                        Platform evidence capture failure detected during{' '}
                        {item.phase}. Intermediate workspace mutations during
                        this transition could not be established.
                      </p>
                      <p className="gap-error-message">
                        Error: {item.errorMessage}
                      </p>
                    </div>
                    <details className="raw-evidence-disclosure">
                      <summary>
                        Raw evidence envelope ({item.rawEventId})
                      </summary>
                      <div className="raw-envelope-body">
                        <pre className="raw-json-block">
                          {JSON.stringify(item.rawEvent, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </article>
                );
              }

              if (item.kind === 'SESSION_SUBMITTED') {
                return (
                  <div
                    className="timeline-marker-card submission-marker"
                    key={`sub_${idx}`}
                  >
                    <div className="marker-content">
                      <div className="marker-dot submitted-dot" />
                      <span className="marker-title">Session Submitted</span>
                      <span className="marker-desc">
                        Final workspace frozen, sandbox container
                        deterministically torn down.
                      </span>
                    </div>
                    <time className="event-time" dateTime={item.timestamp}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </time>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </section>

      {/* Section 02: Deterministic Unified Diff */}
      <section className="evidence-section" aria-labelledby="diff-title">
        <div className="section-heading">
          <p className="section-number">02</p>
          <div>
            <h2 id="diff-title">Deterministic unified diff</h2>
            <p>
              Generated on the server from immutable submitted evidence against
              the Delimit baseline.
            </p>
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
              <p className="section-number">03</p>
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
              <p className="section-number">04</p>
              <h2 id="submitted-title">Submitted file</h2>
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
