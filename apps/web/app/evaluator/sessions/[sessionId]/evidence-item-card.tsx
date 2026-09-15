import type { ReconstructionItem } from '../../../../src/evidence/chronological-reconstruction';

export const EvidenceItemCard = ({
  item,
}: Readonly<{ item: ReconstructionItem }>) => {
  if (item.kind === 'SESSION_ACTIVATED' || item.kind === 'SESSION_SUBMITTED') {
    const submitted = item.kind === 'SESSION_SUBMITTED';
    return (
      <div
        className={`timeline-marker-card ${submitted ? 'submission-marker' : 'activation-marker'}`}
      >
        <div className="marker-content">
          <div className={`marker-dot${submitted ? ' submitted-dot' : ''}`} />
          <span className="marker-title">
            Session {submitted ? 'Submitted' : 'Activated'}
          </span>
          <span className="marker-desc">
            {submitted
              ? 'Final workspace evidence frozen; sandbox cleanup follows independently.'
              : 'Candidate workspace provisioned and ready.'}
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
      <article className="timeline-item-card command-card">
        <div className="timeline-item-header">
          <div className="timeline-item-title">
            <span className="event-seq">#{item.sequence}</span>
            <span className="event-badge badge-command">COMMAND</span>
            <span className="command-text">$ {item.command}</span>
            <span
              className={`badge ${item.timedOut ? 'badge-timeout' : item.exitCode === 0 ? 'badge-success' : 'badge-error'}`}
            >
              {item.timedOut ? 'Timed out' : `Exit ${item.exitCode}`}
            </span>
            <span className="duration-pill">{item.durationMs}ms</span>
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
            <pre className="command-output">{item.stdoutPreview}</pre>
          </div>
        ) : null}
        {item.stderrPreview ? (
          <div className="output-container">
            <pre className="command-output stderr">{item.stderrPreview}</pre>
          </div>
        ) : null}
        <details className="raw-evidence-disclosure">
          <summary>
            Raw evidence envelope ({item.rawStartedEventId} ·{' '}
            {item.rawFinishedEventId})
          </summary>
          <div className="raw-envelope-body">
            {item.rawStartedEvent ? (
              <pre className="raw-json-block">
                {JSON.stringify(item.rawStartedEvent, null, 2)}
              </pre>
            ) : null}
            <pre className="raw-json-block">
              {JSON.stringify(item.rawFinishedEvent, null, 2)}
            </pre>
          </div>
        </details>
      </article>
    );
  }

  if (item.kind === 'WORKSPACE_CHANGE') {
    return (
      <article className="timeline-item-card change-card">
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
            <span className="stat-pill stat-add">+{item.totalAdditions}</span>
            <span className="stat-pill stat-del">-{item.totalDeletions}</span>
            <span className="tree-pill">
              tree: {item.beforeTree.slice(0, 7)} → {item.afterTree.slice(0, 7)}
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
                <span className={`file-status-tag status-${file.status}`}>
                  {file.status}
                </span>
                <span className="file-path-text">{file.path}</span>
                <span className="file-diff-numbers">
                  +{file.additions} / -{file.deletions}
                </span>
              </div>
              {file.patchTruncated ? (
                <div className="truncation-alert">
                  Patch preview truncated — {file.patchPreviewBytes} of{' '}
                  {file.patchBytes} bytes retained.
                </div>
              ) : null}
              {file.patchPreview ? (
                <pre className="file-patch-block">{file.patchPreview}</pre>
              ) : null}
            </div>
          ))}
        </div>
        <details className="raw-evidence-disclosure">
          <summary>Raw evidence envelope ({item.rawEventId})</summary>
          <div className="raw-envelope-body">
            <pre className="raw-json-block">
              {JSON.stringify(item.rawEvent, null, 2)}
            </pre>
          </div>
        </details>
      </article>
    );
  }

  if (
    item.kind === 'WORKSPACE_GAP' ||
    item.kind === 'SANDBOX_CLEANUP_FAILURE'
  ) {
    const gap = item.kind === 'WORKSPACE_GAP';
    return (
      <article className="timeline-item-card gap-card">
        <div className="timeline-item-header">
          <div className="timeline-item-title">
            <span className="event-seq">#{item.sequence}</span>
            <span className="event-badge badge-gap">
              {gap ? 'WORKSPACE_GAP' : 'SANDBOX_CLEANUP_FAILED'}
            </span>
            {gap ? (
              <span className="gap-phase-tag">Phase: {item.phase}</span>
            ) : null}
          </div>
          <time className="event-time" dateTime={item.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </time>
        </div>
        <div className="gap-body">
          <p className="gap-alert-text">
            {gap
              ? 'Intermediate workspace mutations during this transition could not be established.'
              : 'Final evidence was frozen, but sandbox resource cleanup failed.'}
          </p>
          <p className="gap-error-message">Error: {item.errorMessage}</p>
        </div>
        <details className="raw-evidence-disclosure">
          <summary>Raw evidence envelope ({item.rawEventId})</summary>
          <div className="raw-envelope-body">
            <pre className="raw-json-block">
              {JSON.stringify(item.rawEvent, null, 2)}
            </pre>
          </div>
        </details>
      </article>
    );
  }

  return null;
};
