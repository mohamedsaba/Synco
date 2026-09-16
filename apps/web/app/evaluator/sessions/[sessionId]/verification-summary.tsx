import type { RecordedVerification } from '../../../../src/evaluator/evaluator-briefing';

type VerificationSummaryProps = Readonly<{
  verification: RecordedVerification;
  showChronology?: boolean;
}>;

export const VerificationSummary = ({
  verification,
  showChronology = false,
}: VerificationSummaryProps) => {
  const { runs } = verification;

  if (runs.length === 0) {
    return (
      <section
        className="review-section verification-section"
        aria-labelledby="verification-title"
      >
        <header className="review-section-heading">
          <p className="section-kicker">Recorded verification</p>
          <h2 id="verification-title">Verification runs</h2>
          <p>
            No test executions were recognized in the recorded session history.
          </p>
        </header>
      </section>
    );
  }

  return (
    <section
      className="review-section verification-section"
      aria-labelledby="verification-title"
    >
      <header className="review-section-heading">
        <p className="section-kicker">Recorded verification</p>
        <h2 id="verification-title">Verification progression</h2>
        <p>
          Factual test execution results recorded during the assessment. These
          outcomes describe technical execution, not candidate evaluation
          verdicts.
        </p>
      </header>

      <div
        className="verification-runs-flow"
        role="region"
        aria-label="Recorded test executions"
      >
        {runs.map((run, index) => {
          const isFirst = index === 0;
          const isFinal = index === runs.length - 1;
          const positionLabel =
            runs.length === 1
              ? 'Recorded test run'
              : isFirst
                ? 'First recorded test run'
                : isFinal
                  ? 'Final recorded test run'
                  : `Intermediate run (${index + 1})`;

          const outcomeText =
            run.result?.text ??
            (run.exitCode === 0
              ? 'Exited with status 0'
              : `Exited with status ${run.exitCode}`);

          return (
            <div className="verification-run-card" key={run.id}>
              <div className="run-card-header">
                <span className="run-card-position">{positionLabel}</span>
                {run.counts ? (
                  <div className="run-card-counts" aria-label="Test counts">
                    <span className="count-chip count-chip-neutral">
                      {run.counts.failed > 0
                        ? `${run.counts.failed} ${run.counts.failed === 1 ? 'failure' : 'failures'}`
                        : `${run.counts.passed} ${run.counts.passed === 1 ? 'pass' : 'passes'}`}
                    </span>
                  </div>
                ) : null}
              </div>

              <p className="run-card-statement">{outcomeText}</p>

              {showChronology ? (
                <div className="run-card-meta">
                  <span className="meta-item">
                    Order: #{run.chronologyOrder}
                  </span>
                  <span className="meta-item">
                    Exit status: {run.exitCode ?? 'none'}
                  </span>
                  {run.laterWorkspaceEdits ? (
                    <span className="meta-item meta-notice">
                      Later workspace changes recorded
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};
