import { Site, Kicker, Button } from '../home/site';
export const metadata = {
  title: 'Our thinking',
  description:
    'The principles behind Hirearchy: observable work, context, human decisions and neutral treatment of AI use.',
};
const principles = [
  [
    'Observable before inferred.',
    'Start with what happened: the task, the changes, the commands and their outputs. A record cannot tell us someone’s hidden intentions.',
  ],
  [
    'Context before conclusions.',
    'The same action can mean different things in different situations. Keep the task, sequence and source evidence together.',
  ],
  [
    'People own the decision.',
    'A task outcome, a test result and an evaluator’s decision are distinct. Tools make evidence accessible; people bring judgement.',
  ],
  [
    'AI use is neutral.',
    'Record observable interactions without treating the amount of AI use as a measure of ability. Never assume where manually entered code came from.',
  ],
];
export default function ThinkingPage() {
  return (
    <Site>
      <section className="ct-page-hero ct-reveal">
        <Kicker>Our thinking</Kicker>
        <h1 className="ct-enter">
          Start with
          <br />
          the work.
        </h1>
        <p>
          Different disciplines need different tools. These are the principles
          that connect ours.
        </p>
      </section>
      <section className="ct-editorial ct-reveal" aria-label="Our principles">
        <ol className="ct-principles">
          {principles.map(([title, copy], i) => (
            <li className="ct-enter" key={title}>
              <span>0{i + 1}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="ct-statement ct-reveal">
        <h2 className="ct-enter">
          A record to inspect.
          <br />A decision to make.
        </h2>
        <p>See how these principles come together in our first product.</p>
        <Button href="/products/software" light>
          Explore Software
        </Button>
      </section>
    </Site>
  );
}
