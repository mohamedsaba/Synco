const steps = [
  ['Attempt', 'A direction is taken.'],
  ['Verification', 'The result is checked.'],
  ['Failure', 'A limit becomes visible.'],
  ['Investigation', 'The cause is explored.'],
  ['Revision', 'The work responds.'],
  ['Outcome', 'The sequence remains inspectable.'],
] as const;

export const EvidenceNarrativeSection = () => (
  <section
    className="brand-section evidence-story"
    aria-labelledby="evidence-title"
    data-motion="unfold"
  >
    <header className="brand-section-heading brand-section-heading--split">
      <div>
        <p className="brand-kicker">Work leaves evidence</p>
        <h2 id="evidence-title">A result is only part of the story.</h2>
      </div>
      <p>
        Sequence makes individual events more legible without deciding what they
        mean about a person.
      </p>
    </header>

    <figure className="evidence-sequence">
      <ol>
        {steps.map(([label, description], index) => (
          <li key={label}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{label}</strong>
            <small>{description}</small>
          </li>
        ))}
      </ol>
      <figcaption>
        Event, context, verification, revision, and outcome stay connected.
      </figcaption>
    </figure>
  </section>
);
