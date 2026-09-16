import type {
  EvaluatorReviewPresentation,
  ReconstructionViewInput,
} from '../../../../src/evaluator/evaluator-review-presentation';
import { EvidenceDisclosure } from './evidence-disclosure';
import { SummaryLifecycleControl } from './summary-lifecycle-control';

type ReconstructionPanelProps = Readonly<{
  sessionId: string;
  review: EvaluatorReviewPresentation;
  reconstructionStatus: ReconstructionViewInput['status'];
  activatedAt: string | null;
}>;

export const ReconstructionPanel = ({
  sessionId,
  review,
  reconstructionStatus,
  activatedAt,
}: ReconstructionPanelProps) => {
  const byReference = new Map(
    review.evidenceEntries.map((entry) => [entry.evidenceRef, entry]),
  );

  return (
    <section
      className="review-section summary-section"
      aria-labelledby="summary-title"
    >
      <header className="review-section-heading">
        <p className="section-kicker">Grounded session summary</p>
        <h2 id="summary-title">What happened</h2>
        <p>
          Each factual statement is grounded in recorded session evidence. Open
          supporting activity to inspect the source.
        </p>
      </header>

      {review.summary.status === 'available' ? (
        <ol className="summary-timeline">
          {review.summary.milestones.map((milestone) => {
            const entries = milestone.evidenceRefs.flatMap((reference) => {
              const entry = byReference.get(reference);
              return entry ? [entry] : [];
            });
            return (
              <li className="summary-milestone" key={milestone.id}>
                <article>
                  <header className="summary-milestone-heading">
                    <div>
                      <p className="milestone-label">{milestone.label}</p>
                      <p className="milestone-copy">{milestone.text}</p>
                    </div>
                    {milestone.elapsedLabel ? (
                      <span className="milestone-time">
                        {milestone.elapsedLabel}
                      </span>
                    ) : null}
                  </header>
                  {milestone.detail ? (
                    <p className="milestone-detail">{milestone.detail}</p>
                  ) : null}
                  <EvidenceDisclosure
                    activatedAt={activatedAt}
                    entries={entries}
                    submittedDiff={review.submittedDiff}
                  />
                </article>
              </li>
            );
          })}
        </ol>
      ) : (
        <SummaryLifecycleControl
          reconstructionStatus={
            reconstructionStatus === 'AVAILABLE'
              ? 'FAILED'
              : reconstructionStatus
          }
          sessionId={sessionId}
        />
      )}
    </section>
  );
};
