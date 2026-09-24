export const CampaignSection = () => (
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
