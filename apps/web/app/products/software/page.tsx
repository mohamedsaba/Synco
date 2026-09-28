import { Site, Kicker, Button, ContactCta } from '../../home/site';
export const metadata = {
  title: 'Hirearchy Software',
  description:
    'See engineering work in context through real tasks, a visible record and human review.',
};
export default function SoftwarePage() {
  return (
    <Site dark>
      <section className="ct-page-hero ct-page-hero--dark ct-reveal">
        <Kicker>Hirearchy Software / First product</Kicker>
        <h1 className="ct-enter">
          See engineering
          <br />
          work in context.
        </h1>
        <p>
          A candidate works on a real engineering task. Observable events become
          an inspectable record. People decide what that evidence means.
        </p>
        <Button href="/contact?topic=software" light>
          Start a conversation
        </Button>
      </section>
      <section className="ct-editorial ct-editorial--lilac ct-reveal">
        <h2 className="ct-enter">The work. The record.</h2>
        <div className="ct-record-grid">
          <article className="ct-record ct-enter">
            <Kicker>Illustrative task</Kicker>
            <h3>Investigate a failing test.</h3>
            <p>
              Read the existing code, make a change and check the result. The
              problem provides the context; the candidate chooses how to
              approach it.
            </p>
          </article>
          <article className="ct-record ct-enter">
            <Kicker>Illustrative record</Kicker>
            <ol>
              <li>Command executed</li>
              <li>Workspace change captured</li>
              <li>Test output recorded</li>
              <li>Submission recorded</li>
            </ol>
          </article>
        </div>
      </section>
      <section className="ct-editorial ct-reveal">
        <h2 className="ct-enter">
          Evidence informs.
          <br />
          People decide.
        </h2>
        <ol className="ct-principles">
          <li className="ct-enter">
            <span>01</span>
            <h3>A chronological view.</h3>
            <p>
              Follow recorded work in order, with the surrounding task context.
            </p>
          </li>
          <li className="ct-enter">
            <span>02</span>
            <h3>Inspectable sources.</h3>
            <p>
              Open the underlying commands, changes and outputs. Keep
              observations connected to their sources.
            </p>
          </li>
          <li className="ct-enter">
            <span>03</span>
            <h3>Visible uncertainty.</h3>
            <p>
              Capture gaps and limitations remain visible. A record of work is
              evidence for a conversation, not an automatic verdict.
            </p>
          </li>
        </ol>
      </section>
      <section className="ct-editorial ct-editorial--lilac ct-reveal">
        <h2 className="ct-enter">AI use is part of the context.</h2>
        <p className="ct-enter">
          Observable AI interactions can be included in the record. Using AI
          heavily, lightly or not at all carries no automatic positive or
          negative judgement. People review the evidence in context.
        </p>
      </section>
      <ContactCta title="Start with real engineering work." />
    </Site>
  );
}
