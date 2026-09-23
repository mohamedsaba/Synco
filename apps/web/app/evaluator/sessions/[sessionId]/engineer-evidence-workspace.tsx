'use client';

import { useState } from 'react';
import type {
  ObservedStatement,
  BriefingAiSummary,
  RecordedVerification,
  SubmittedStateSummary,
} from '../../../../src/evaluator/evaluator-briefing';
import type { EvaluatorReviewPresentation } from '../../../../src/evaluator/evaluator-review-presentation';
import type { EvidenceCatalogEntry } from '../../../../src/reconstruction/evidence-reference-catalog';
import { EvidenceItemCard } from './evidence-item-card';
import { RecordedActivity } from './recorded-activity';
import { SubmittedWork } from './submitted-work';
import { TechnicalRecord } from './technical-record';

type InspectionPanel = 'evidence' | 'submittedChanges' | 'technicalRecord';

type EngineerEvidenceWorkspaceProps = Readonly<{
  activities: readonly ObservedStatement[];
  verification: RecordedVerification;
  evidenceEntries: readonly EvidenceCatalogEntry[];
  review: EvaluatorReviewPresentation;
  submittedState: SubmittedStateSummary;
  activatedAt: string | null;
  aiSummary: BriefingAiSummary;
}>;

export const EngineerEvidenceWorkspace = ({
  activities,
  verification,
  evidenceEntries,
  review,
  submittedState,
  activatedAt,
  aiSummary,
}: EngineerEvidenceWorkspaceProps) => {
  const [selectedEvidenceRef, setSelectedEvidenceRef] = useState<string | null>(
    null,
  );
  const [selectedPanel, setSelectedPanel] =
    useState<InspectionPanel>('submittedChanges');
  const selectedEntry = evidenceEntries.find(
    (entry) => entry.evidenceRef === selectedEvidenceRef,
  );

  const selectEvidence = (evidenceRef: string) => {
    setSelectedEvidenceRef(evidenceRef);
    setSelectedPanel('evidence');
  };

  return (
    <section
      className="engineer-evidence-workspace"
      aria-label="Engineer evidence workspace"
    >
      <div className="engineer-chronology-context">
        <RecordedActivity
          activities={activities}
          verification={verification}
          evidenceEntries={evidenceEntries}
          showDetailedTechnical
          showStructuredEvidence
          showDirectEvidenceLinks
          showVerificationChronology
          aiSummary={aiSummary}
          showConfiguredModel
          showTokenTelemetry
          activatedAt={activatedAt}
          selectedEvidenceRef={selectedEvidenceRef}
          onSelectEvidence={selectEvidence}
        />
      </div>

      <aside
        className="engineer-inspection-panel"
        id="engineer-inspection"
        aria-labelledby="engineer-inspection-title"
      >
        <header className="review-section-heading">
          <p className="section-kicker">Technical inspection</p>
          <h2 id="engineer-inspection-title">Source evidence</h2>
          <p>Chronology remains visible while inspecting recorded details.</p>
        </header>

        <div
          className="engineer-inspection-actions"
          aria-label="Inspection views"
        >
          <button
            type="button"
            className="evidence-toggle-button"
            aria-pressed={selectedPanel === 'submittedChanges'}
            onClick={() => setSelectedPanel('submittedChanges')}
          >
            Final submitted state
          </button>
          <button
            type="button"
            className="evidence-toggle-button"
            aria-pressed={selectedPanel === 'technicalRecord'}
            onClick={() => setSelectedPanel('technicalRecord')}
          >
            Technical record
          </button>
        </div>

        {selectedPanel === 'submittedChanges' ? (
          <SubmittedWork
            submittedState={submittedState}
            diff={review.submittedDiff}
          />
        ) : null}

        {selectedPanel === 'technicalRecord' ? (
          <TechnicalRecord review={review} activatedAt={activatedAt} />
        ) : null}

        {selectedPanel === 'evidence' && selectedEntry ? (
          <section
            className="engineer-selected-evidence"
            aria-labelledby="selected-evidence-title"
          >
            <h3 id="selected-evidence-title">Selected source evidence</h3>
            <dl className="engineer-evidence-provenance">
              <div>
                <dt>Evidence reference</dt>
                <dd>
                  <code>{selectedEntry.evidenceRef}</code>
                </dd>
              </div>
              <div>
                <dt>Record kind</dt>
                <dd>{selectedEntry.kind}</dd>
              </div>
              <div>
                <dt>Evidence role</dt>
                <dd>{selectedEntry.role}</dd>
              </div>
            </dl>
            {selectedEntry.item ? (
              <EvidenceItemCard
                item={selectedEntry.item}
                showConfiguredModel
                showTokenTelemetry
                showTechnicalDetails
              />
            ) : (
              <p className="empty-evidence-copy">
                Source evidence reference: {selectedEntry.evidenceRef}.
              </p>
            )}
          </section>
        ) : null}

        {selectedPanel === 'evidence' && !selectedEntry ? (
          <p className="empty-evidence-copy">
            Select evidence from the chronology to inspect its recorded details.
          </p>
        ) : null}
      </aside>
    </section>
  );
};
