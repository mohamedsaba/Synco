import { AdaptiveFrame } from './shared';

export const HirearchyHero = () => (
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
      <span className="frame-aperture" aria-hidden="true" />
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

    <div className="brand-hero__transition">
      <a className="hero-scroll" href="#approach">
        Follow the work <span aria-hidden="true">↓</span>
      </a>
      <span className="hero-transition__axis" aria-hidden="true" />
    </div>
  </section>
);
