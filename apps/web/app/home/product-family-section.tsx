import { AdaptiveFrame, Arrow, ContextAperture } from './shared';

export const ProductFamilySection = () => (
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
        <div className="family__root-mast">
          <span className="family__root-brand">
            <ContextAperture size={32} className="family__root-mark" />
            Hirearchy
          </span>
          <span className="family__root-type">Masterbrand architecture</span>
        </div>
        <p className="family__root-axiom">
          Real work → evidence → clearer human decisions
        </p>
      </div>

      <div className="family__body">
        <div className="family__vertical family__vertical--current">
          <div className="family__vertical-intro">
            <span className="family__vertical-status">Current product</span>
            <h3 className="family__vertical-title">Hirearchy Software</h3>
            <p className="family__vertical-desc">
              Engineering work in a realistic environment.
            </p>
          </div>

          <div
            className="family__inhabited"
            role="group"
            aria-label="Software environment layers"
          >
            <div className="family__layer">
              <span className="family__layer-idx">01</span>
              <div className="family__layer-meta">
                <strong className="family__layer-name">
                  Controlled workspace
                </strong>
                <span className="family__layer-spec">
                  Codebase · Terminal · Tooling
                </span>
              </div>
            </div>
            <div className="family__layer">
              <span className="family__layer-idx">02</span>
              <div className="family__layer-meta">
                <strong className="family__layer-name">
                  Observable events
                </strong>
                <span className="family__layer-spec">
                  Edits · Checks · Revision path
                </span>
              </div>
            </div>
            <div className="family__layer">
              <span className="family__layer-idx">03</span>
              <div className="family__layer-meta">
                <strong className="family__layer-name">
                  Evaluator reconstruction
                </strong>
                <span className="family__layer-spec">
                  Chronology · Source evidence
                </span>
              </div>
            </div>
          </div>

          <div className="family__handoff">
            <span className="family__handoff-status">
              Active product release
            </span>
            <a href="#software" className="family__handoff-link">
              See software environment <Arrow />
            </a>
          </div>
        </div>

        <div className="family__future-wing">
          <div className="family__vertical family__vertical--future family__vertical--it">
            <div className="family__vertical-intro">
              <span className="family__vertical-status">Future direction</span>
              <h3 className="family__vertical-title">Hirearchy IT</h3>
              <p className="family__vertical-desc">
                Its own work, context, and evidence.
              </p>
            </div>

            <div className="family__provisional" aria-hidden="true">
              <div className="family__provisional-grid family__provisional-grid--it" />
              <div className="family__provisional-ledger">
                <span>Infrastructure & systems</span>
                <span>Framework reserved</span>
              </div>
            </div>
          </div>

          <div className="family__vertical family__vertical--future family__vertical--marketing">
            <div className="family__vertical-intro">
              <span className="family__vertical-status">Future direction</span>
              <h3 className="family__vertical-title">Hirearchy Marketing</h3>
              <p className="family__vertical-desc">
                Shared principles, expressed for the discipline.
              </p>
            </div>

            <div className="family__provisional" aria-hidden="true">
              <div className="family__provisional-grid family__provisional-grid--marketing" />
              <div className="family__provisional-ledger">
                <span>Strategy & narrative</span>
                <span>Framework reserved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdaptiveFrame>
  </section>
);
