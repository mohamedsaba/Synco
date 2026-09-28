import { Site, Kicker, Button, ContactCta } from '../home/site';
export const metadata = {
  title: 'About',
  description:
    'Hirearchy is a family of tools for seeing work clearly, starting with Hirearchy Software.',
};
export default function AboutPage() {
  return (
    <Site>
      <section className="ct-page-hero ct-page-hero--white ct-reveal">
        <Kicker>About Hirearchy</Kicker>
        <h1 className="ct-enter">
          Different disciplines.
          <br />A shared foundation.
        </h1>
        <p>
          Hirearchy is the umbrella for a growing family of tools, each shaped
          around a different kind of work. We’re starting with Software.
        </p>
      </section>
      <section className="ct-statement ct-reveal">
        <Kicker>One philosophy</Kicker>
        <h2 className="ct-enter">
          Evidence informs.
          <br />
          People decide.
        </h2>
        <p>
          We build around a simple idea: seeing the work gives people something
          concrete to understand, question and discuss.
        </p>
      </section>
      <section className="ct-editorial ct-editorial--lilac ct-reveal">
        <h2 className="ct-enter">Built around the work.</h2>
        <div className="ct-columns">
          <article className="ct-enter">
            <h3>Work.</h3>
            <p>
              Real tasks, relevant to a discipline. Room for different
              approaches and outcomes.
            </p>
          </article>
          <article className="ct-enter">
            <h3>Evidence.</h3>
            <p>
              A visible record with context, source material and clearly stated
              limitations.
            </p>
          </article>
          <article className="ct-enter">
            <h3>People.</h3>
            <p>
              Human review, questions and judgement. The decision belongs to the
              person.
            </p>
          </article>
        </div>
      </section>
      <section className="ct-editorial ct-reveal">
        <h2 className="ct-enter">Starting with Software.</h2>
        <p>
          Engineering gives this principle its first setting. IT and Marketing
          are future directions for the family, with their own contexts to
          explore.
        </p>
        <Button href="/products">Meet the family</Button>
      </section>
      <ContactCta />
    </Site>
  );
}
