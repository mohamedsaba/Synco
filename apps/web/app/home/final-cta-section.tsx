import Link from 'next/link';

import { CreateSessionButton } from '../create-session-button';
import { BrandLogo } from './shared';

export const FinalCtaSection = () => (
  <section
    className="brand-section final-cta"
    id="get-started"
    aria-labelledby="final-title"
    data-motion="settle"
  >
    <div className="final-cta__rule" aria-hidden="true" />
    <div className="final-cta__copy">
      <p className="brand-kicker">Hirearchy Software</p>
      <h2 id="final-title">Hire with more to go on.</h2>
      <p>Start with a real-work software assessment.</p>
    </div>
    <div className="final-cta__actions">
      <CreateSessionButton />
      <Link href="/evaluator">Evaluator access</Link>
    </div>
    <footer>
      <a className="brand-wordmark" href="#top" aria-label="Hirearchy home">
        <BrandLogo variant="primary" />
      </a>
      <p>Evidence for human decisions.</p>
    </footer>
  </section>
);
