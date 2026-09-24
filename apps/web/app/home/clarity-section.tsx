export const ClaritySection = () => (
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
        <dt>
          <span className="clarity__state">Observed</span>
          What happened
        </dt>
        <dd>Observable events in the order they occurred.</dd>
      </div>
      <div className="clarity__layer">
        <dt>
          <span className="clarity__state">Changed</span>
          What changed
        </dt>
        <dd>The work before and after revision.</dd>
      </div>
      <div className="clarity__layer">
        <dt>
          <span className="clarity__state">Verified</span>
          What was verified
        </dt>
        <dd>Checks and outcomes with their source context.</dd>
      </div>
      <div className="clarity__layer clarity__layer--uncertain">
        <dt>
          <span className="clarity__state">Unresolved</span>
          What remains uncertain
        </dt>
        <dd>Limits stay visible instead of becoming assumptions.</dd>
      </div>
    </dl>
    <p className="clarity__close">More context. Less guessing.</p>
  </section>
);
