import type { CommandFinishedPayload } from '../../../../src/events/session-event';
import type { ReconstructionItem } from '../../../../src/evidence/chronological-reconstruction';

type EvidenceItemCardProps = Readonly<{
  item: ReconstructionItem;
  elapsedLabel?: string | null;
  compact?: boolean;
}>;

const EvidenceTime = ({
  elapsedLabel,
  timestamp,
}: Readonly<{ elapsedLabel?: string | null; timestamp: string }>) => (
  <time className="evidence-time" dateTime={timestamp}>
    {elapsedLabel ?? new Date(timestamp).toLocaleTimeString()}
  </time>
);

export const EvidenceItemCard = ({
  item,
  elapsedLabel,
  compact = false,
}: EvidenceItemCardProps) => {
  if (item.kind === 'SESSION_ACTIVATED' || item.kind === 'SESSION_SUBMITTED') {
    const submitted = item.kind === 'SESSION_SUBMITTED';
    return (
      <article className="activity-card activity-boundary-card">
        <div>
          <p className="activity-label">
            {submitted ? 'Session submitted' : 'Session started'}
          </p>
          <p className="activity-copy">
            {submitted
              ? 'The submitted workspace state was frozen for evaluator review.'
              : 'The candidate workspace became available.'}
          </p>
        </div>
        <EvidenceTime elapsedLabel={elapsedLabel} timestamp={item.timestamp} />
      </article>
    );
  }

  if (item.kind === 'COMMAND_EXECUTION') {
    const output = item.rawFinishedEvent.payload as CommandFinishedPayload;
    const result = item.timedOut
      ? 'Timed out'
      : item.exitCode === null
        ? 'No recorded exit status'
        : `Exit status ${item.exitCode}`;
    return (
      <article className="activity-card command-activity-card">
        <header className="activity-card-header">
          <div>
            <p className="activity-label">Terminal activity</p>
            <code className="activity-command">$ {item.command}</code>
          </div>
          <EvidenceTime
            elapsedLabel={elapsedLabel}
            timestamp={item.finishedAt}
          />
        </header>
        <div className="activity-result" aria-label={`Command ${result}`}>
          <span>{result}</span>
          <span>{item.durationMs} ms</span>
          <span>{item.cwd}</span>
        </div>
        {output.stdoutTruncated ? (
          <p className="activity-limitation">
            Standard output is a captured preview. Additional output was
            omitted.
          </p>
        ) : null}
        {output.stderrTruncated ? (
          <p className="activity-limitation">
            Standard error is a captured preview. Additional output was omitted.
          </p>
        ) : null}
        {!compact && item.stdoutPreview ? (
          <div className="activity-output">
            <p>Standard output</p>
            <pre>{item.stdoutPreview}</pre>
          </div>
        ) : null}
        {!compact && item.stderrPreview ? (
          <div className="activity-output">
            <p>Standard error</p>
            <pre>{item.stderrPreview}</pre>
          </div>
        ) : null}
      </article>
    );
  }

  if (item.kind === 'WORKSPACE_CHANGE') {
    const origin =
      item.origin === 'browser_save'
        ? 'Recorded after an editor save'
        : item.origin === 'command_execution'
          ? 'Recorded across terminal activity'
          : 'Recorded between captured actions';
    return (
      <article className="activity-card workspace-activity-card">
        <header className="activity-card-header">
          <div>
            <p className="activity-label">Workspace change</p>
            <p className="activity-copy">{origin}</p>
          </div>
          <EvidenceTime
            elapsedLabel={elapsedLabel}
            timestamp={item.timestamp}
          />
        </header>
        <div className="activity-file-list">
          {item.files.map((file) => (
            <section className="activity-file" key={file.path}>
              <header>
                <code>{file.path}</code>
                <span
                  aria-label={`${file.additions} additions and ${file.deletions} deletions`}
                >
                  <span className="diff-addition-count">+{file.additions}</span>{' '}
                  <span className="diff-deletion-count">−{file.deletions}</span>
                </span>
              </header>
              {file.patchTruncated ? (
                <p className="activity-limitation">
                  The displayed patch is partial. {file.patchPreviewBytes} of{' '}
                  {file.patchBytes} bytes are shown.
                </p>
              ) : null}
              {!compact && file.patchPreview ? (
                <pre className="activity-patch">{file.patchPreview}</pre>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    );
  }

  if (item.kind === 'WORKSPACE_GAP') {
    return (
      <article className="activity-card capture-limitation-card">
        <header className="activity-card-header">
          <div>
            <p className="activity-label">Activity capture incomplete</p>
            <p className="activity-copy">
              Delimit could not establish every intermediate workspace change
              during this interval. Other recorded activity remains available.
            </p>
          </div>
          <EvidenceTime
            elapsedLabel={elapsedLabel}
            timestamp={item.timestamp}
          />
        </header>
      </article>
    );
  }

  return (
    <article className="activity-card platform-notice-card">
      <header className="activity-card-header">
        <div>
          <p className="activity-label">Platform cleanup notice</p>
          <p className="activity-copy">
            The submitted evidence was frozen before sandbox cleanup reported a
            platform error.
          </p>
        </div>
        <EvidenceTime elapsedLabel={elapsedLabel} timestamp={item.timestamp} />
      </header>
    </article>
  );
};
