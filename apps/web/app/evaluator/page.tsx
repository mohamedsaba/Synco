import Link from 'next/link';

import { EvaluatorAccessForm } from './evaluator-access-form';

const EvaluatorAccessPage = () => (
  <main className="access-shell">
    <section className="access-card" aria-labelledby="access-title">
      <p className="eyebrow">Evaluator access</p>
      <h1 id="access-title">Review submitted evidence.</h1>
      <p className="brief-copy">
        Enter the session reference and the separate local evaluator credential.
        Candidate session links cannot open evidence.
      </p>
      <EvaluatorAccessForm />
      <Link className="text-link" href="/">
        Return to session issuance
      </Link>
    </section>
  </main>
);

export default EvaluatorAccessPage;
