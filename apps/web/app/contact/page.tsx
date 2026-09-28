import { Site, Kicker } from '../home/site';
import { ContactForm } from '../home/contact-form';
export const metadata = {
  title: 'Contact',
  description:
    'Start a conversation about Hirearchy Software or another kind of work.',
};
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return (
    <Site>
      <section className="ct-contact">
        <div className="ct-contact-intro">
          <Kicker>Start a conversation</Kicker>
          <h1>
            Let’s talk
            <br />
            about real
            <br />
            work.
          </h1>
          <p>
            Tell us what you’re working on and what you’d like to understand.
            We’ll take it from there.
          </p>
          <div className="ct-contact-line" aria-hidden="true" />
        </div>
        <ContactForm
          initialTopic={topic === 'software' ? 'Hirearchy Software' : ''}
        />
      </section>
      <section className="ct-editorial">
        <h2>A few places to start.</h2>
        <ol className="ct-principles">
          <li>
            <span>01</span>
            <h3>Hirearchy Software.</h3>
            <p>
              Talk about real engineering tasks and evidence for human review.
            </p>
          </li>
          <li>
            <span>02</span>
            <h3>Another discipline.</h3>
            <p>
              Share the context of your field and the work you want to see more
              clearly.
            </p>
          </li>
          <li>
            <span>03</span>
            <h3>A question or an idea.</h3>
            <p>
              Tell us what’s on your mind. A conversation is a good place to
              begin.
            </p>
          </li>
        </ol>
      </section>
    </Site>
  );
}
