type SubmittedDiffProps = Readonly<{
  diff: string;
  compact?: boolean;
}>;

export const submittedChangesAnchor = 'submitted-changes';

type DiffLineKind = 'addition' | 'deletion' | 'context' | 'meta';

const lineKind = (line: string): DiffLineKind => {
  if (line.startsWith('+++') || line.startsWith('---')) return 'meta';
  if (line.startsWith('+')) return 'addition';
  if (line.startsWith('-')) return 'deletion';
  if (line.startsWith('@@') || line.startsWith('diff --git')) return 'meta';
  return 'context';
};

const lineLabel = (kind: DiffLineKind) => {
  if (kind === 'addition') return 'Added line';
  if (kind === 'deletion') return 'Deleted line';
  if (kind === 'meta') return 'Diff metadata';
  return 'Context line';
};

export const SubmittedDiff = ({
  diff,
  compact = false,
}: SubmittedDiffProps) => {
  const lines = diff.split('\n');
  const visibleLines = compact ? lines.slice(0, 80) : lines;

  if (!diff.trim()) {
    return (
      <p className="empty-evidence-copy">
        No submitted code changes were recorded against the scenario baseline.
      </p>
    );
  }

  return (
    <div
      className="submitted-diff"
      role="region"
      aria-label="Submitted code changes"
      tabIndex={0}
    >
      {visibleLines.map((line, index) => {
        const kind = lineKind(line);
        return (
          <div
            className={`diff-line diff-line-${kind}`}
            key={`${index}-${line}`}
          >
            <span className="visually-hidden">{lineLabel(kind)}: </span>
            <code>{line || ' '}</code>
          </div>
        );
      })}
      {compact && lines.length > visibleLines.length ? (
        <p className="diff-truncation-note">
          <a
            className="diff-truncation-link"
            href={`#${submittedChangesAnchor}`}
          >
            View full submitted changes →
          </a>
        </p>
      ) : null}
    </div>
  );
};
