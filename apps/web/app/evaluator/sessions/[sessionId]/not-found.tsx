import Link from 'next/link';

const EvaluatorReviewNotFound = () => (
  <main className="access-shell">
    <section className="access-card" aria-labelledby="not-found-title">
      <p className="eyebrow">Evaluator review</p>
      <h1 id="not-found-title">Session not found.</h1>
      <p className="brief-copy">
        Check the session reference or return to evaluator access.
      </p>
      <Link className="text-link" href="/evaluator">
        Return to evaluator access
      </Link>
    </section>
  </main>
);

export default EvaluatorReviewNotFound;
