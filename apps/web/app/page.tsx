import Link from 'next/link';

import { CreateSessionButton } from './create-session-button';

const HomePage = () => (
  <main className="home-shell">
    <section className="home-intro" aria-labelledby="page-title">
      <div>
        <p className="eyebrow">
          Synco / Delimit · Candidate + Evaluator Experience
        </p>
        <h1 id="page-title">Realistic incident. Authoritative evidence.</h1>
        <p className="summary">
          Host realistic multi-file engineering incidents in isolated containers
          with local services. Capture workspace mutations and authoritative
          command events for human evaluation without scoring or AI judging.
        </p>
      </div>
      <div className="home-actions">
        <CreateSessionButton />
        <Link className="text-link" href="/evaluator">
          Open evaluator access
        </Link>
      </div>
      <div className="principle" aria-label="Product flow">
        <span>Real work</span>
        <span aria-hidden="true">→</span>
        <span>immutable evidence</span>
        <span aria-hidden="true">→</span>
        <span>human review</span>
      </div>
    </section>
  </main>
);

export default HomePage;
