import Link from 'next/link';

import { AdaptiveFrame, Arrow } from './shared';

export const HirearchySoftwareSection = () => (
  <section
    className="brand-section software"
    id="software"
    aria-labelledby="software-title"
    data-motion="enter"
  >
    <header className="brand-section-heading brand-section-heading--split">
      <div>
        <p className="brand-kicker">Hirearchy Software</p>
        <h2 id="software-title">See engineering work in context.</h2>
      </div>
      <p>
        Candidates work inside a realistic professional environment. Evaluators
        receive a structured chronology with its source evidence.
      </p>
    </header>

    <AdaptiveFrame
      className="software__environment"
      label="Hirearchy Software candidate and evaluator environment"
    >
      <div className="software__candidate">
        <span className="software__role">Candidate environment</span>
        <div className="software__work">
          <p>Scenario</p>
          <strong>Understand the work</strong>
          <p>Files · Commands · AI</p>
          <strong>Investigate and revise</strong>
          <p>Submission</p>
          <strong>Preserve the final work</strong>
        </div>
        <small>AI is permitted tooling inside the environment.</small>
      </div>
      <div className="software__handoff" aria-hidden="true">
        <span>Evidence</span>
        <span>→</span>
      </div>
      <div className="software__evaluator">
        <span className="software__role">Evaluator review</span>
        <div className="software__record">
          <span>Chronology</span>
          <span>Submitted work</span>
          <span>Source evidence</span>
          <span>Known limits</span>
        </div>
        <p>
          The evidence supports review.
          <strong>The final hiring decision remains human.</strong>
        </p>
      </div>
    </AdaptiveFrame>

    <div className="software__links">
      <a href="#get-started">
        Try the current product <Arrow />
      </a>
      <Link href="/evaluator">
        Open evaluator access <Arrow />
      </Link>
    </div>
  </section>
);
