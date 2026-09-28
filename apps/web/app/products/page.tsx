import { Site, Kicker, Button, Icon, ContactCta } from '../home/site';
export const metadata = {
  title: 'Products',
  description:
    'Explore Hirearchy Software and the future directions of the Hirearchy family.',
};
export default function ProductsPage() {
  return (
    <Site>
      <section className="ct-page-hero ct-reveal">
        <div className="ct-hero-loop" aria-hidden="true" />
        <Kicker>The Hirearchy family</Kicker>
        <h1 className="ct-enter">
          One principle.
          <br />
          Different kinds
          <br />
          of work.
        </h1>
        <p>
          Tools built around the work people do. Each with its own context. All
          with the same belief: evidence informs, people decide.
        </p>
      </section>
      <section className="ct-product-spread ct-reveal">
        <div className="ct-enter">
          <Kicker>01 / First product</Kicker>
          <h2>
            Hirearchy
            <br />
            Software
          </h2>
          <p>
            Real engineering tasks. A chronological record of observable work.
            Evidence that people can inspect and discuss.
          </p>
          <Button href="/products/software" light>
            Explore Software
          </Button>
        </div>
        <div
          className="ct-product-diagram ct-enter"
          aria-label="From a real task to a visible record"
        >
          <div>
            <Icon />A real task
          </div>
          <div>
            <Icon type="record" />A visible record
          </div>
        </div>
      </section>
      <section id="future" className="ct-editorial ct-reveal">
        <h2 className="ct-enter">
          The same principle.
          <br />
          New kinds of work.
        </h2>
        <div className="ct-future-row ct-enter">
          <h3>Hirearchy IT</h3>
          <p>A future direction for seeing IT work in context.</p>
          <span>Future direction</span>
        </div>
        <div className="ct-future-row ct-enter">
          <h3>Hirearchy Marketing</h3>
          <p>A future direction for seeing marketing work in context.</p>
          <span>Future direction</span>
        </div>
        <p className="ct-future-note">
          These are future directions, not products available today.
        </p>
      </section>
      <ContactCta title="Have a field in mind?" />
    </Site>
  );
}
