import { AdaptiveFrame } from './shared';

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
