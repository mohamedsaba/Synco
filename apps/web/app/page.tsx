import Link from 'next/link';

import { CreateSessionButton } from './create-session-button';

const HomePage = () => (
  <main className="home-shell">
    <section className="home-intro" aria-labelledby="page-title">
      <div>
        <p className="eyebrow">Synco / Delimit · Vertical Slice 1</p>
        <h1 id="page-title">The smallest complete evidence loop.</h1>
        <p className="summary">
          Issue one fixed scenario, persist one candidate edit, freeze it at
          submission, and review the exact server-generated diff.
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
