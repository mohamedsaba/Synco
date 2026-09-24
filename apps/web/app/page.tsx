import Link from 'next/link';
import type { ReactNode } from 'react';

import { CreateSessionButton } from './create-session-button';

const Arrow = () => <span aria-hidden="true">↗</span>;

type AdaptiveFrameProps = Readonly<{
  className?: string;
  children: ReactNode;
  label: string;
}>;

const AdaptiveFrame = ({
  className = '',
  children,
  label,
}: AdaptiveFrameProps) => (
  <div className={`adaptive-frame ${className}`.trim()} aria-label={label}>
    {children}
  </div>
);

const SiteHeader = () => (
  <header className="brand-header">
    <a className="brand-wordmark" href="#top" aria-label="Hirearchy home">
      Hirearchy<span aria-hidden="true">.</span>
    </a>
    <nav aria-label="Homepage">
      <a href="#approach">Approach</a>
      <a href="#software">Software</a>
      <a href="#get-started">Get started</a>
    </nav>
  </header>
);

const HeroSection = () => (
  <section
    className="brand-section brand-hero"
    aria-labelledby="hero-title"
    data-motion="organize"
  >
    <div className="brand-hero__copy">
      <p className="brand-kicker">Real-work assessment</p>
      <h1 id="hero-title">Hirearchy</h1>
      <p className="brand-hero__line">Evidence over impressions.</p>
      <p className="brand-hero__support">
        Real work, made clearer for human hiring decisions.
      </p>
    </div>

    <AdaptiveFrame
      className="brand-hero__frame"
      label="Evidence fragments becoming a clearer body of work"
    >
      <span className="frame-axis frame-axis--vertical" aria-hidden="true" />
      <span className="frame-axis frame-axis--horizontal" aria-hidden="true" />
      <div className="evidence-fragment evidence-fragment--attempt">
        <span>01</span>
        <strong>Attempt</strong>
        <small>A change is made</small>
      </div>
      <div className="evidence-fragment evidence-fragment--check">
        <span>02</span>
        <strong>Verification</strong>
        <small>A result is observed</small>
      </div>
      <div className="evidence-fragment evidence-fragment--revision">
        <span>03</span>
        <strong>Revision</strong>
        <small>The work responds</small>
      </div>
      <div className="evidence-fragment evidence-fragment--context">
        <p>One moment is useful.</p>
        <p>A sequence gives it context.</p>
      </div>
    </AdaptiveFrame>

    <a className="hero-scroll" href="#approach">
      Follow the work <span aria-hidden="true">↓</span>
    </a>
  </section>
);

const ImpressionsSection = () => (
  <section
    className="brand-section impressions"
    id="approach"
    aria-labelledby="impressions-title"
    data-motion="reframe"
  >
    <div className="section-index" aria-hidden="true">
      01 / 06
    </div>
    <div className="impressions__moments" aria-label="Individual impressions">
      <p>A confident answer.</p>
      <p>A polished résumé.</p>
      <p>A strong first impression.</p>
    </div>
    <div className="impressions__reframe">
      <p className="brand-kicker">A wider view</p>
      <h2 id="impressions-title">
        An impression is a moment.
        <br />
        <em>Work has context.</em>
      </h2>
      <p>
        Interviews and résumés begin the conversation. Seeing the work adds
        another kind of understanding.
      </p>
    </div>
  </section>
);

const EvidenceSection = () => {
  const steps = [
    ['Attempt', 'A direction is taken.'],
    ['Verification', 'The result is checked.'],
    ['Failure', 'A limit becomes visible.'],
    ['Investigation', 'The cause is explored.'],
    ['Revision', 'The work responds.'],
    ['Outcome', 'The sequence remains inspectable.'],
  ] as const;

  return (
    <section
      className="brand-section evidence-story"
      aria-labelledby="evidence-title"
      data-motion="unfold"
    >
      <header className="brand-section-heading brand-section-heading--split">
        <div>
          <p className="brand-kicker">Work leaves evidence</p>
          <h2 id="evidence-title">A result is only part of the story.</h2>
        </div>
        <p>
          Sequence makes individual events more legible without deciding what
          they mean about a person.
        </p>
      </header>

      <figure className="evidence-sequence">
        <ol>
          {steps.map(([label, description], index) => (
            <li key={label}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
              <small>{description}</small>
            </li>
          ))}
        </ol>
        <figcaption>
          Event, context, verification, revision, and outcome stay connected.
        </figcaption>
      </figure>
    </section>
  );
};

const ClaritySection = () => (
  <section
    className="brand-section clarity"
    aria-labelledby="clarity-title"
    data-motion="prioritize"
  >
    <div className="clarity__intro">
      <p className="brand-kicker">From evidence to clarity</p>
      <h2 id="clarity-title">Keep the detail. Clarify the hierarchy.</h2>
    </div>
    <dl className="clarity__layers">
      <div className="clarity__layer clarity__layer--primary">
        <dt>What happened</dt>
        <dd>Observable events in the order they occurred.</dd>
      </div>
      <div className="clarity__layer">
        <dt>What changed</dt>
        <dd>The work before and after revision.</dd>
      </div>
      <div className="clarity__layer">
        <dt>What was verified</dt>
        <dd>Checks and outcomes with their source context.</dd>
      </div>
      <div className="clarity__layer clarity__layer--uncertain">
        <dt>What remains uncertain</dt>
        <dd>Limits stay visible instead of becoming assumptions.</dd>
      </div>
    </dl>
    <p className="clarity__close">More context. Less guessing.</p>
  </section>
);

const FamilySection = () => (
  <section
    className="brand-section family"
    aria-labelledby="family-title"
    data-motion="adapt"
  >
    <header className="brand-section-heading">
      <p className="brand-kicker">One belief, adapted to the work</p>
      <h2 id="family-title">Hirearchy is the masterbrand.</h2>
    </header>

    <AdaptiveFrame className="family__frame" label="Hirearchy product family">
      <div className="family__root">
        <span>Hirearchy</span>
        <p>Real work → evidence → clearer human decisions</p>
      </div>
      <div className="family__vertical family__vertical--current">
        <span>Current product</span>
        <h3>Hirearchy Software</h3>
        <p>Engineering work in a realistic environment.</p>
      </div>
      <div className="family__vertical family__vertical--future">
        <span>Future direction</span>
        <h3>Hirearchy IT</h3>
        <p>Its own work, context, and evidence.</p>
      </div>
      <div className="family__vertical family__vertical--future">
        <span>Future direction</span>
        <h3>Hirearchy Marketing</h3>
        <p>Shared principles, expressed for the discipline.</p>
      </div>
    </AdaptiveFrame>
  </section>
);

const SoftwareSection = () => (
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

const CampaignSection = () => (
  <section
    className="brand-section campaign"
    aria-labelledby="campaign-title"
    data-motion="contrast"
  >
    <p className="campaign__context">
      A résumé opens a conversation.
      <br />
      Work adds context.
    </p>
    <h2 id="campaign-title" className="campaign__line">
      <span className="campaign__evidence">Evidence</span>
      <span className="campaign__over">over</span>
      <span className="campaign__impressions">impressions.</span>
    </h2>
  </section>
);

const FinalSection = () => (
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
      <a className="brand-wordmark" href="#top">
        Hirearchy<span aria-hidden="true">.</span>
      </a>
      <p>Evidence for human decisions.</p>
    </footer>
  </section>
);

const HomePage = () => (
  <main className="brand-home" id="top">
    <SiteHeader />
    <HeroSection />
    <ImpressionsSection />
    <EvidenceSection />
    <ClaritySection />
    <FamilySection />
    <SoftwareSection />
    <CampaignSection />
    <FinalSection />
  </main>
);

export default HomePage;
