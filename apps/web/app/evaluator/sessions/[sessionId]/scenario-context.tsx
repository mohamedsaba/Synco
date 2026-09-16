import {
  notObservedExplanation,
  type EvaluatorReviewPresentation,
} from '../../../../src/evaluator/evaluator-review-presentation';
import { EvidenceDisclosure } from './evidence-disclosure';

type ScenarioContextProps = Readonly<{
  review: EvaluatorReviewPresentation;
  activatedAt: string | null;
}>;

export const ScenarioContext = ({
  review,
  activatedAt,
}: ScenarioContextProps) => {
  const context = review.scenario.context;
  const byReference = new Map(
    review.evidenceEntries.map((entry) => [entry.evidenceRef, entry]),
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

      {context ? (
        <div className="scenario-context-body">
          <p className="scenario-purpose">{context.purpose}</p>
          <div className="scenario-area-grid">
            {review.scenario.relatedEvidence.map((area) => {
              const entries = area.evidenceRefs.flatMap((reference) => {
                const entry = byReference.get(reference);
                return entry ? [entry] : [];
              });
              return (
                <article className="scenario-area" key={area.id}>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  {entries.length > 0 ? (
                    <EvidenceDisclosure
                      activatedAt={activatedAt}
                      entries={entries}
                      label="View related recorded activity"
                      submittedDiff={review.submittedDiff}
                    />
                  ) : (
                    <p className="not-observed-copy">
                      {notObservedExplanation}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          <div className="scenario-guidance-grid">
            <section>
              <h3>Relevant system context</h3>
              <ul>
                {context.systemInvariants.map((invariant) => (
                  <li key={invariant}>{invariant}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Relevant verification areas</h3>
              <p className="verification-area-note">
                These areas describe parts of the scenario that may be relevant
                to technical review. They are not a pass/fail checklist, and
                valid work may address them in different ways.
              </p>
              <ul>
                {context.verificationTargets.map((target) => (
                  <li key={target}>{target}</li>
                ))}
              </ul>
            </section>
          </div>
          {context.interpretationWarnings.map((warning) => (
            <p className="interpretation-note" key={warning}>
              {warning}
            </p>
          ))}
          {context.reviewPolicy.map((policy) => (
            <p className="review-policy" key={policy}>
              {policy}
            </p>
          ))}
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
