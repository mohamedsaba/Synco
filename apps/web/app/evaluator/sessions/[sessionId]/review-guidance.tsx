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
        <p>
          Assessment policy parameters governing candidate evaluation and
          technical handoff.
        </p>
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

        <div className="handoff-action-bar">
          <button
            type="button"
            className="action-button-handoff"
            title="Policy requires engineering review before technical decisions"
            aria-describedby="handoff-note"
            disabled
          >
            Request engineering review
          </button>
          <span id="handoff-note" className="handoff-affordance-note">
            Standard review routing: technical judgment requires an evaluator
            verdict.
          </span>
        </div>
      </div>
    </section>
  );
};
