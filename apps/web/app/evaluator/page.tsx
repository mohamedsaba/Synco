import { cookies } from 'next/headers';
import Link from 'next/link';

import {
  evaluatorCookieName,
  isEvaluatorCookieValid,
} from '../../src/access/evaluator-access';
import { EvaluatorAccessForm } from './evaluator-access-form';
import { EvaluatorReviewQueue } from './evaluator-review-queue';

export const dynamic = 'force-dynamic';

const EvaluatorAccessPage = async () => {
  const cookieStore = await cookies();
  const authenticated = isEvaluatorCookieValid(
    cookieStore.get(evaluatorCookieName)?.value,
  );

  return (
    <main className="access-shell">
      <section
        className="access-card evaluator-entry-card"
        aria-labelledby="access-title"
      >
        <p className="eyebrow">Evaluator access</p>
        <h1 id="access-title">Review submitted assessments.</h1>
        {authenticated ? (
          <>
            <section aria-labelledby="review-queue-title">
              <h2 id="review-queue-title">Available for review</h2>
              <EvaluatorReviewQueue />
            </section>
            <section
              className="evaluator-known-session"
              aria-labelledby="known-session-title"
            >
              <h2 id="known-session-title">Open a known session</h2>
              <p className="brief-copy">
                Direct evaluator links remain available when you have a session
                reference.
              </p>
              <EvaluatorAccessForm authenticated />
            </section>
          </>
        ) : (
          <>
            <p className="brief-copy">
              Enter the separate local evaluator credential to review submitted
              assessments. A known session reference remains available as a
              direct path.
            </p>
            <EvaluatorAccessForm />
          </>
        )}
        <Link className="text-link" href="/">
          Return to session issuance
        </Link>
      </section>
    </main>
  );
};

export default EvaluatorAccessPage;
