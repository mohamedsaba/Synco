import {
  formatElapsed,
  type EvaluatorReviewPresentation,
} from '../../../../src/evaluator/evaluator-review-presentation';
import { EvidenceItemCard } from './evidence-item-card';
import { RawRecordCard } from './raw-record-card';

export const TechnicalRecord = ({
  review,
  activatedAt,
}: Readonly<{
  review: EvaluatorReviewPresentation;
  activatedAt: string | null;
}>) => (
  <section
    className="technical-review"
    aria-labelledby="technical-review-title"
  >
    <header className="review-section-heading">
      <p className="section-kicker">Technical review</p>
      <h2 id="technical-review-title">Recorded activity</h2>
      <p>
        The complete chronological record remains available for technical
        verification.
      </p>
    </header>

    <details className="review-disclosure">
      <summary>
        <span>Open technical chronology</span>
        <span className="disclosure-chevron" aria-hidden="true">
          ›
        </span>
      </summary>
      <div className="technical-chronology">
        {review.chronology.map((item, index) => {
          const timestamp =
            item.kind === 'COMMAND_EXECUTION'
              ? item.finishedAt
              : item.timestamp;
          return (
            <EvidenceItemCard
              elapsedLabel={formatElapsed(activatedAt, timestamp)}
              item={item}
              key={`${item.kind}-${'sequence' in item ? item.sequence : index}`}
            />
          );
        })}
      </div>
    </details>

    <details className="review-disclosure raw-records-disclosure">
      <summary>
        <span>Inspect raw records</span>
        <span className="disclosure-chevron" aria-hidden="true">
          ›
        </span>
      </summary>
      <div className="raw-record-list">
        {review.chronology.map((item, index) => (
          <RawRecordCard
            item={item}
            key={`${item.kind}-${'sequence' in item ? item.sequence : index}`}
          />
        ))}
      </div>
    </details>
  </section>
);
