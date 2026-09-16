import type { ContextEntry } from '../../../../src/evaluator/evaluator-briefing';

type TaskBriefProps = Readonly<{
  taskContext: readonly ContextEntry[];
  showScenarioReference: boolean;
  contextAvailable?: boolean;
}>;

export const TaskBrief = ({
  taskContext,
  showScenarioReference,
  contextAvailable = true,
}: TaskBriefProps) => {
  const briefEntry = taskContext.find((c) => c.kind === 'task_brief');
  const invariants = taskContext.filter((c) => c.kind === 'system_invariant');
  const verificationAreas = taskContext.filter(
    (c) => c.kind === 'verification_area',
  );
  const warnings = taskContext.filter(
    (c) => c.kind === 'interpretation_warning',
  );

  return (
    <section
      className="review-section scenario-context"
      aria-labelledby="scenario-context-title"
    >
      <header className="review-section-heading">
        <p className="section-kicker">Scenario context</p>
        <h2 id="scenario-context-title">What this scenario examines</h2>
        <p>
          This context helps organize the review. It is not evidence and does
          not indicate that the candidate demonstrated any particular
          capability.
        </p>
      </header>

      {contextAvailable ? (
        <div className="task-brief-content">
          {briefEntry ? (
            <div className="task-brief-description">
              <p className="scenario-purpose">{briefEntry.authoredText}</p>
            </div>
          ) : null}

          {showScenarioReference &&
          (invariants.length > 0 || verificationAreas.length > 0) ? (
            <div className="scenario-reference-grid">
              {invariants.length > 0 ? (
                <div className="scenario-reference-block">
                  <h3 className="reference-subheading">
                    Relevant system context
                  </h3>
                  <ul className="reference-list">
                    {invariants.map((inv) => (
                      <li key={inv.id}>{inv.authoredText}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {verificationAreas.length > 0 ? (
                <div className="scenario-reference-block">
                  <h3 className="reference-subheading">
                    Relevant verification areas
                  </h3>
                  <p className="verification-area-note">
                    These areas describe parts of the scenario that may be
                    relevant to technical review. They are not a pass/fail
                    checklist, and valid work may address them in different
                    ways.
                  </p>
                  <ul className="reference-list">
                    {verificationAreas.map((target) => (
                      <li key={target.id}>{target.authoredText}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {showScenarioReference && warnings.length > 0 ? (
            <div className="interpretation-warnings-block">
              {warnings.map((w) => (
                <p className="interpretation-note" key={w.id}>
                  {w.authoredText}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="scenario-context-body">
          <p>
            Scenario evaluation context is not available for this earlier
            session. Recorded activity and submitted changes remain available.
          </p>
        </div>
      )}
    </section>
  );
};
