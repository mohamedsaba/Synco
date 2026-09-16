'use client';

import { useState } from 'react';
import type { ObservedStatement } from '../../../../src/evaluator/evaluator-briefing';
import type { EvidenceCatalogEntry } from '../../../../src/reconstruction/evidence-reference-catalog';
import { EvidenceItemCard } from './evidence-item-card';

type RecordedActivityProps = Readonly<{
  activities: readonly ObservedStatement[];
  evidenceEntries: readonly EvidenceCatalogEntry[];
  showDetailedTechnical?: boolean;
}>;

export const RecordedActivity = ({
  activities,
  evidenceEntries,
  showDetailedTechnical = false,
}: RecordedActivityProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const byReference = new Map(
    evidenceEntries.map((entry) => [entry.evidenceRef, entry]),
  );

  const toggleDisclosure = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <section
      className="review-section activity-section"
      aria-labelledby="recorded-activity-title"
    >
      <header className="review-section-heading">
        <p className="section-kicker">Chronological progression</p>
        <h2 id="recorded-activity-title">Recorded activity</h2>
        <h3 id="summary-title" className="subheading-h3">
          What happened
        </h3>
        <p>
          Each factual statement is grounded in recorded session evidence.
          Expand evidence to inspect the exact technical record.
        </p>
      </header>

      <div
        className="activity-timeline"
        role="feed"
        aria-label="Chronological activity statements"
      >
        {activities.map((activity, index) => {
          const isExpanded = expandedId === activity.id;
          const matchingEntries = (activity.evidenceRefs ?? []).flatMap(
            (ref) => {
              const entry = byReference.get(ref);
              return entry ? [entry] : [];
            },
          );

          return (
            <article
              key={activity.id}
              className={`activity-item activity-item-${activity.kind}`}
              aria-posinset={index + 1}
              aria-setsize={activities.length}
            >
              <div className="activity-marker-container" aria-hidden="true">
                <span className="activity-marker" />
                {index < activities.length - 1 ? (
                  <span className="activity-line" />
                ) : null}
              </div>

              <div className="activity-content">
                <div className="activity-main-line">
                  <p className="activity-text">{activity.text}</p>
                  {matchingEntries.length > 0 ? (
                    <button
                      type="button"
                      className="evidence-toggle-button"
                      aria-expanded={isExpanded}
                      aria-controls={`evidence-drawer-${activity.id}`}
                      onClick={() => toggleDisclosure(activity.id)}
                    >
                      <span>
                        {isExpanded ? 'Hide evidence' : 'View evidence'}
                      </span>
                      <span className="disclosure-chevron" aria-hidden="true">
                        {isExpanded ? '▾' : '›'}
                      </span>
                    </button>
                  ) : null}
                </div>

                {showDetailedTechnical &&
                activity.paths &&
                activity.paths.length > 0 ? (
                  <div className="activity-paths-badge">
                    <span className="badge-label">File:</span>
                    {activity.paths.map((p) => (
                      <code key={p} className="code-inline">
                        {p}
                      </code>
                    ))}
                  </div>
                ) : null}

                {isExpanded && matchingEntries.length > 0 ? (
                  <div
                    id={`evidence-drawer-${activity.id}`}
                    className="activity-evidence-drawer"
                  >
                    <div className="evidence-entries-list">
                      {matchingEntries.map((entry) => (
                        <div
                          key={entry.evidenceRef}
                          id={`evidence-${entry.evidenceRef}`}
                          className="evidence-entry-card"
                        >
                          <div className="entry-header">
                            <span className="entry-role">{entry.role}</span>
                            <span className="entry-kind">{entry.kind}</span>
                            <code className="entry-ref">
                              {entry.evidenceRef}
                            </code>
                          </div>
                          {entry.item ? (
                            <EvidenceItemCard item={entry.item} />
                          ) : (
                            <p className="empty-evidence-copy">
                              Recorded submission diff reference.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
