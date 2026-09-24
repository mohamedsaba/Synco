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
      <div className="software__substrate">
        <div className="software__substrate-context">
          <span className="software__substrate-system">Hirearchy Software</span>
          <span className="software__substrate-divider" aria-hidden="true">
            /
          </span>
          <span className="software__substrate-mode">
            Inhabited engineering environment
          </span>
        </div>
        <div className="software__substrate-datum">
          <span>Observable events</span>
          <span>Structured record</span>
          <span>Human decision</span>
        </div>
      </div>

      <div className="software__grid">
        <div className="software__pane software__pane--candidate">
          <div className="software__pane-mast">
            <span className="software__pane-kicker">Candidate environment</span>
            <h3 className="software__pane-title">
              Controlled engineering scenario
            </h3>
            <p className="software__pane-desc">
              Realistic codebase, supervised commands, and permitted tools.
              Every action produces observable evidence.
            </p>
          </div>

          <div
            className="software__work"
            aria-label="Candidate workspace components"
          >
            <div className="software__fixture">
              <div className="software__fixture-meta">
                <span className="software__fixture-badge">01</span>
                <span className="software__fixture-label">Scenario</span>
              </div>
              <strong className="software__fixture-title">
                Understand the work
              </strong>
              <p className="software__fixture-spec">
                Realistic issue context, system constraints, and expected
                behavior.
              </p>
            </div>

            <div className="software__fixture">
              <div className="software__fixture-meta">
                <span className="software__fixture-badge">02</span>
                <span className="software__fixture-label">Files · Editor</span>
              </div>
              <strong className="software__fixture-title">
                Investigate and revise
              </strong>
              <p className="software__fixture-spec">
                Multi-file tree navigation, editor persistence, and code
                changes.
              </p>
            </div>

            <div className="software__fixture">
              <div className="software__fixture-meta">
                <span className="software__fixture-badge">03</span>
                <span className="software__fixture-label">
                  Terminal · Verification
                </span>
              </div>
              <strong className="software__fixture-title">
                Run tests and commands
              </strong>
              <p className="software__fixture-spec">
                Supervised execution runs and test feedback recorded in
                real-time.
              </p>
            </div>

            <div className="software__fixture software__fixture--tooling">
              <div className="software__fixture-meta">
                <span className="software__fixture-badge">04</span>
                <span className="software__fixture-label">Permitted tools</span>
              </div>
              <strong className="software__fixture-title">
                AI is permitted tooling inside the environment.
              </strong>
              <p className="software__fixture-spec">
                Prompts and assistance are captured as observable events, never
                inferred as intent or scored automatically.
              </p>
            </div>
          </div>

          <div className="software__pane-closure">
            <span className="software__closure-label">Submission</span>
            <span className="software__closure-note">
              Preserve the final work
            </span>
          </div>
        </div>

        <div
          className="software__conduit"
          aria-label="Observable evidence pipeline"
        >
          <div className="software__conduit-top">
            <span className="software__conduit-kicker">Conduit</span>
            <span className="software__conduit-title">Evidence</span>
          </div>

          <div
            className="software__conduit-stream"
            aria-label="Evidence transmission stages"
          >
            <div className="software__conduit-node">
              <span className="software__conduit-step">01</span>
              <span className="software__conduit-text">Raw events</span>
            </div>
            <div className="software__conduit-vector" aria-hidden="true">
              <span className="software__conduit-arrow software__conduit-arrow--horizontal">
                →
              </span>
              <span className="software__conduit-arrow software__conduit-arrow--vertical">
                ↓
              </span>
            </div>
            <div className="software__conduit-node">
              <span className="software__conduit-step">02</span>
              <span className="software__conduit-text">Chronology</span>
            </div>
            <div className="software__conduit-vector" aria-hidden="true">
              <span className="software__conduit-arrow software__conduit-arrow--horizontal">
                →
              </span>
              <span className="software__conduit-arrow software__conduit-arrow--vertical">
                ↓
              </span>
            </div>
            <div className="software__conduit-node">
              <span className="software__conduit-step">03</span>
              <span className="software__conduit-text">Source diff</span>
            </div>
          </div>

          <div className="software__conduit-bottom">
            <span className="software__conduit-axiom">
              Zero automated inference
            </span>
          </div>
        </div>

        <div className="software__pane software__pane--evaluator">
          <div className="software__pane-mast">
            <span className="software__pane-kicker">Evaluator review</span>
            <h3 className="software__pane-title">
              Evidence-led reconstruction
            </h3>
            <p className="software__pane-desc">
              Structured chronology with expandable source evidence and
              reconstructed context. Evaluators own the interpretation.
            </p>
          </div>

          <div
            className="software__record"
            aria-label="Evaluator review components"
          >
            <div className="software__record-item">
              <div className="software__record-header">
                <span className="software__record-tag">Chronology</span>
                <span className="software__record-meta">Sequence</span>
              </div>
              <strong className="software__record-title">
                Observed work timeline
              </strong>
              <p className="software__record-desc">
                Attempts, investigations, test executions, and revisions in
                exact chronological order.
              </p>
            </div>

            <div className="software__record-item">
              <div className="software__record-header">
                <span className="software__record-tag">Submitted work</span>
                <span className="software__record-meta">Final state</span>
              </div>
              <strong className="software__record-title">
                Complete source diff
              </strong>
              <p className="software__record-desc">
                Candidate code modifications reviewed directly against the
                repository baseline.
              </p>
            </div>

            <div className="software__record-item software__record-item--source">
              <div className="software__record-header">
                <span className="software__record-tag">Source evidence</span>
                <span className="software__record-meta">Facts</span>
              </div>
              <strong className="software__record-title">
                Verification & tooling traces
              </strong>
              <p className="software__record-desc">
                Supervised execution logs, test outputs, and recorded AI tool
                interactions.
              </p>
            </div>

            <div className="software__record-item software__record-item--limits">
              <div className="software__record-header">
                <span className="software__record-tag">Known limits</span>
                <span className="software__record-meta">Boundary</span>
              </div>
              <strong className="software__record-title">
                Platform notice
              </strong>
              <p className="software__record-desc">
                What the environment observes versus unmeasured intent.
                Objective facts without psychological claims.
              </p>
            </div>
          </div>

          <div className="software__authority">
            <p className="software__authority-text">
              The evidence supports review.
              <strong className="software__authority-verdict">
                The final hiring decision remains human.
              </strong>
            </p>
          </div>
        </div>
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
