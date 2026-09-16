'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { presentCandidateWorkStatement } from '../../../../src/reconstruction/candidate-work-presentation';
import type { EvidenceCatalogEntry } from '../../../../src/reconstruction/evidence-reference-catalog';
import type { EvidenceReconstructionRecord } from '../../../../src/reconstruction/evidence-reconstruction';
import { EvidenceItemCard } from './evidence-item-card';

type SafeRecord = Omit<EvidenceReconstructionRecord, 'attemptToken'>;

type ReconstructionPanelProps = Readonly<{
  sessionId: string;
  initial: Readonly<{
    status: 'NOT_STARTED' | 'PENDING' | 'AVAILABLE' | 'FAILED';
    record: SafeRecord | null;
    legacyArtifacts: readonly Readonly<{
      id: string;
      status: EvidenceReconstructionRecord['status'];
      promptVersion: string;
      providerId: string | null;
      modelId: string | null;
      createdAt: string;
      completedAt: string | null;
    }>[];
  }>;
  entries: readonly EvidenceCatalogEntry[];
  submittedDiff: string;
}>;

const EvidenceReference = ({
  entry,
  submittedDiff,
}: {
  entry: EvidenceCatalogEntry;
  submittedDiff: string;
}) => {
  return (
    <details className="raw-evidence-disclosure">
      <summary>View evidence · {entry.evidenceRef}</summary>
      <div className="raw-envelope-body">
        <p className="file-kicker">
          Source role: {entry.role.replace('_', ' ')}
          {entry.firstSequence === null
            ? ''
            : ` · sequence ${entry.firstSequence}${entry.lastSequence !== entry.firstSequence ? `–${entry.lastSequence}` : ''}`}
        </p>
        {entry.item ? (
          <EvidenceItemCard item={entry.item} />
        ) : (
          <pre className="diff-block">{submittedDiff}</pre>
        )}
      </div>
    </details>
  );
};

export const ReconstructionPanel = ({
  sessionId,
  initial,
  entries,
  submittedDiff,
}: ReconstructionPanelProps) => {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const byReference = new Map(
    entries.map((entry) => [entry.evidenceRef, entry]),
  );

  const requestReconstruction = async (retryFailed: boolean) => {
    setRequesting(true);
    setRequestError(null);
    try {
      const response = await fetch(
        `/api/evaluator/sessions/${sessionId}/reconstruction`,
        retryFailed
          ? {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ retryFailed: true }),
            }
          : {
              method: 'POST',
            },
      );
      if (!response.ok) {
        setRequestError('Candidate Work reconstruction could not be started.');
        return;
      }
    } finally {
      setRequesting(false);
      router.refresh();
    }
  };

  useEffect(() => {
    if (initial.status === 'PENDING') {
      const refresh = window.setTimeout(async () => {
        await fetch(`/api/evaluator/sessions/${sessionId}/reconstruction`, {
          method: 'POST',
        });
        router.refresh();
      }, 5_000);
      return () => window.clearTimeout(refresh);
    }
  }, [initial.status, router, sessionId]);

  return (
    <section
      className="evidence-section"
      aria-labelledby="candidate-work-title"
    >
      <div className="section-heading">
        <p className="section-number">01</p>
        <div>
          <h2 id="candidate-work-title">Candidate Work</h2>
          <p>
            Deterministic plain-language reconstruction from recorded evidence.
            This is evidence navigation, not an evaluator decision or competence
            assessment.
          </p>
        </div>
      </div>

      <div className="timeline-list">
        {initial.status === 'NOT_STARTED' ? (
          <div className="capture-note">
            <p>Candidate Work reconstruction has not started.</p>
            <button
              className="primary-action"
              disabled={requesting}
              onClick={() => void requestReconstruction(false)}
              type="button"
            >
              {requesting ? 'Building…' : 'Build Candidate Work'}
            </button>
          </div>
        ) : null}
        {requestError ? (
          <div className="capture-note">{requestError}</div>
        ) : null}
        {initial.legacyArtifacts.length > 0 ? (
          <div className="capture-note">
            {initial.legacyArtifacts.length} earlier experimental reconstruction
            artifact(s) remain retained for audit. Their prose is not exposed as
            current Candidate Work.
          </div>
        ) : null}
        {initial.status === 'PENDING' ? (
          <div className="capture-note">
            Candidate Work reconstruction is pending…
          </div>
        ) : null}
        {initial.status === 'FAILED' && initial.record ? (
          <div className="capture-note">
            <p>
              Candidate Work reconstruction failed ({initial.record.failureCode}
              ). {initial.record.failureMessage}
            </p>
            <button
              className="primary-action"
              disabled={requesting}
              onClick={() => void requestReconstruction(true)}
              type="button"
            >
              {requesting ? 'Retrying…' : 'Retry Candidate Work'}
            </button>
          </div>
        ) : null}
        {initial.status === 'AVAILABLE' && initial.record?.content
          ? initial.record.content.statements.map((statement) => {
              const statementEntries = statement.evidenceRefs.flatMap(
                (reference) => {
                  const entry = byReference.get(reference);
                  return entry ? [entry] : [];
                },
              );
              const category = presentCandidateWorkStatement(
                statement,
                statementEntries,
              );
              return (
                <article className="timeline-item-card" key={statement.id}>
                  <div className="timeline-item-header">
                    <div className="timeline-item-title">
                      <span
                        className={`event-badge candidate-work-badge ${category.className}`}
                      >
                        {category.label}
                      </span>
                      <strong>{statement.text}</strong>
                    </div>
                  </div>
                  {statement.detail ? <p>{statement.detail}</p> : null}
                  <div>
                    {statement.evidenceRefs.map((reference) => {
                      const entry = byReference.get(reference);
                      return entry ? (
                        <EvidenceReference
                          entry={entry}
                          key={reference}
                          submittedDiff={submittedDiff}
                        />
                      ) : null;
                    })}
                  </div>
                </article>
              );
            })
          : null}
      </div>
    </section>
  );
};
