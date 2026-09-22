import type { PolicyGuidance } from '../../../../src/evaluator/evaluator-briefing';

type ReviewGuidanceProps = Readonly<{
  guidance: readonly PolicyGuidance[];
}>;

export const ReviewGuidance = ({ guidance }: ReviewGuidanceProps) => {
  return (
    <section
      className="review-section guidance-section"
      aria-labelledby="review-guidance-title"
    >
      <header className="review-section-heading">
        <p className="section-kicker">Evaluation policy</p>
        <h2 id="review-guidance-title">Review guidance</h2>
        <p>Assessment policy parameters governing human evaluation.</p>
      </header>

      <div className="guidance-card">
        {guidance.length > 0 ? (
          <div className="guidance-policy-list">
            {guidance.map((item) => (
              <p key={item.id} className="guidance-policy-text">
                {item.authoredText}
              </p>
            ))}
          </div>
        ) : (
          <p className="guidance-policy-text">
            Automated checks cover specific recorded behavior. Engineering
            review is required for technical interpretation and evaluation
            decisions.
          </p>
        )}

        <p className="guidance-policy-text">
          Technical judgment remains a human evaluator decision.
        </p>
      </div>
    </section>
  );
};
