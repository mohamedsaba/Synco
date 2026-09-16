'use client';

import { useEffect } from 'react';

const EvaluatorReviewError = ({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) => {
  useEffect(() => {
    console.error('Evaluator review failed to render', error);
  }, [error]);

  return (
    <main className="access-shell">
      <section className="access-card" aria-labelledby="review-error-title">
        <p className="eyebrow">Evaluator review</p>
        <h1 id="review-error-title">The review could not be opened.</h1>
        <p className="brief-copy">
          Try loading the recorded session again. No candidate evidence has been
          changed.
        </p>
        <button className="button button-primary" onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
};

export default EvaluatorReviewError;
