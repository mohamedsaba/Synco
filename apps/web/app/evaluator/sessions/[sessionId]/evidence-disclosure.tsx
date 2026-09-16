import { formatElapsed } from '../../../../src/evaluator/evaluator-review-presentation';
import type { EvidenceCatalogEntry } from '../../../../src/reconstruction/evidence-reference-catalog';
import { EvidenceItemCard } from './evidence-item-card';
import { SubmittedDiff } from './submitted-diff';

type EvidenceDisclosureProps = Readonly<{
  entries: readonly EvidenceCatalogEntry[];
  submittedDiff: string;
  activatedAt: string | null;
  label?: string;
}>;

export const EvidenceDisclosure = ({
  entries,
  submittedDiff,
  activatedAt,
  label = 'View supporting activity',
}: EvidenceDisclosureProps) => (
  <details className="supporting-activity-disclosure">
    <summary>
      <span>{label}</span>
      <span className="disclosure-count">
        {entries.length} {entries.length === 1 ? 'record' : 'records'}
      </span>
      <span className="disclosure-chevron" aria-hidden="true">
        ›
      </span>
    </summary>
    <div className="supporting-activity-body">
      {entries.map((entry) =>
        entry.item ? (
          <div id={`evidence-${entry.evidenceRef}`} key={entry.evidenceRef}>
            <EvidenceItemCard
              item={entry.item}
              elapsedLabel={formatElapsed(
                activatedAt,
                entry.item.kind === 'COMMAND_EXECUTION'
                  ? entry.item.finishedAt
                  : entry.item.timestamp,
              )}
            />
          </div>
        ) : (
          <SubmittedDiff compact diff={submittedDiff} key={entry.evidenceRef} />
        ),
      )}
    </div>
  </details>
);
