import type { SubmittedStateSummary } from '../../../../src/evaluator/evaluator-briefing';
import { SubmittedDiff, submittedChangesAnchor } from './submitted-diff';

type SubmittedWorkProps = Readonly<{
  submittedState: SubmittedStateSummary;
  diff: string;
  prominentDiff?: boolean;
}>;

export const SubmittedWork = ({
  submittedState,
  diff,
  prominentDiff = true,
}: SubmittedWorkProps) => {
  const { changedPaths, additions, deletions, text } = submittedState;
  const fileCount = changedPaths.length;

  return (
    <section
      className="review-section submitted-changes-section"
      aria-labelledby="submitted-changes-title"
      id={submittedChangesAnchor}
    >
      <header className="review-section-heading">
        <p className="section-kicker">Submitted state</p>
        <h2 id="submitted-changes-title">Submitted changes</h2>
        <p>
          Server-derived changes against the immutable scenario baseline.
          Addition and deletion colors describe code changes, not candidate
          quality.
        </p>
      </header>

      <div className="submitted-summary-card">
        <div className="submitted-summary-header">
          <p className="submitted-narrative">{text}</p>
          <div
            className="submitted-stat-group"
            aria-label="Line modification summary"
          >
            {additions !== null ? (
              <span className="stat-pill stat-addition">
                +{additions} lines
              </span>
            ) : null}
            {deletions !== null ? (
              <span className="stat-pill stat-deletion">
                −{deletions} lines
              </span>
            ) : null}
            <span className="stat-pill stat-neutral">
              {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {changedPaths.length > 0 ? (
          <div className="changed-paths-list">
            <span className="changed-paths-label">Modified files:</span>
            {changedPaths.map((p) => (
              <code key={p} className="changed-path-code">
                {p}
              </code>
            ))}
          </div>
        ) : null}
      </div>

      {prominentDiff ? (
        <div className="submitted-diff-container">
          <SubmittedDiff diff={diff} />
        </div>
      ) : (
        <details className="submitted-diff-disclosure">
          <summary className="submitted-diff-toggle">
            View submitted changes
          </summary>
          <div className="submitted-diff-container">
            <SubmittedDiff diff={diff} />
          </div>
        </details>
      )}
    </section>
  );
};
