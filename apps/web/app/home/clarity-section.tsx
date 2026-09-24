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
