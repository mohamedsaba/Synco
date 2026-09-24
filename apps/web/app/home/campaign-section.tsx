export const CampaignSection = () => (
  <section
    className="brand-section campaign"
    aria-labelledby="campaign-title"
    data-motion="contrast"
  >
    <div className="campaign__aperture" aria-hidden="true" />
    <header className="campaign__masthead">
      <div className="campaign__kicker">
        <span className="campaign__kicker-dot" aria-hidden="true" />
        <span>Hirearchy position</span>
      </div>
      <p className="campaign__context">
        A résumé opens a conversation.
        <br />
        Work adds context.
      </p>
    </header>

    <div className="campaign__display">
      <h2 id="campaign-title" className="campaign__line">
        <span className="campaign__evidence">Evidence</span>
        <span className="campaign__fulcrum">
          <span className="campaign__axis-rule" aria-hidden="true" />
          <span className="campaign__over">over</span>
          <span className="campaign__axis-rule" aria-hidden="true" />
        </span>
        <span className="campaign__impressions">impressions.</span>
      </h2>
    </div>

    <footer className="campaign__colophon">
      <span className="campaign__colophon-axiom">
        The observable record precedes interpretation.
      </span>
      <span className="campaign__colophon-datum" aria-hidden="true">
        07 / Expressive peak
      </span>
    </footer>
  </section>
);
