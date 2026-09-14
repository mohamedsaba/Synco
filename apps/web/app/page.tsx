const HomePage = () => (
  <main>
    <section aria-labelledby="page-title">
      <p className="eyebrow">Synco / Delimit</p>
      <h1 id="page-title">Engineering work, reconstructed as evidence.</h1>
      <p className="summary">
        This repository is prepared for the first product slice. Candidate and
        evaluator workflows have intentionally not been implemented yet.
      </p>
      <div className="principle">
        <span>Observe real work</span>
        <span aria-hidden="true">→</span>
        <span>preserve evidence</span>
        <span aria-hidden="true">→</span>
        <span>let humans decide</span>
      </div>
    </section>
  </main>
);

export default HomePage;
