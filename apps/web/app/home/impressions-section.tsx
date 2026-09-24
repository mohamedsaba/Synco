export const ImpressionsSection = () => (
  <section
    className="brand-section impressions"
    id="approach"
    aria-labelledby="impressions-title"
    data-motion="reframe"
  >
    <div className="impressions__content">
      <div
        className="impressions__moments"
        role="group"
        aria-label="Individual impressions"
      >
        <p className="brand-kicker impressions__kicker">First encounter</p>
        <div className="impressions__moment-list">
          <p className="impressions__moment impressions__moment--1">
            <span>A confident answer.</span>
          </p>
          <p className="impressions__moment impressions__moment--2">
            <span>A polished résumé.</span>
          </p>
          <p className="impressions__moment impressions__moment--3">
            <span>A strong first impression.</span>
          </p>
        </div>
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
    </div>

    <div className="impressions__transition" aria-hidden="true">
      <span className="impressions-transition__axis" />
    </div>
  </section>
);
