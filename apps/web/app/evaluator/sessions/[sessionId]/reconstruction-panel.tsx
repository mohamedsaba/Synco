'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { EvidenceCatalogEntry } from '../../../../src/reconstruction/evidence-reference-catalog';
import type { EvidenceReconstructionRecord } from '../../../../src/reconstruction/evidence-reconstruction';
import { EvidenceItemCard } from './evidence-item-card';

type SafeRecord = Omit<EvidenceReconstructionRecord, 'attemptToken'>;

type ReconstructionPanelProps = Readonly<{
  sessionId: string;
  initial: Readonly<{
    status: 'NOT_STARTED' | 'PENDING' | 'AVAILABLE' | 'FAILED';
    record: SafeRecord | null;
    providerConfigured: boolean;
  }>;
  entries: readonly EvidenceCatalogEntry[];
  integrity: Readonly<{
    gapCount: number;
    outOfBandCount: number;
  }>;
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
  integrity,
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
        setRequestError('AI reconstruction could not be started.');
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
            AI-assisted plain-language reconstruction. This is evidence
            navigation, not an evaluator decision or competence assessment.
          </p>
        </div>
      </div>

      {integrity.gapCount > 0 || integrity.outOfBandCount > 0 ? (
        <div className="capture-note" style={{ margin: '1.5rem' }}>
          Evidence integrity notice: {integrity.gapCount} capture gap(s) and{' '}
          {integrity.outOfBandCount} workspace change(s) between recorded
          actions remain visible independently of the AI reconstruction.
        </div>
      ) : null}

      <div className="timeline-list">
        {initial.status === 'NOT_STARTED' ? (
          <div className="capture-note">
            <p>
              {initial.providerConfigured
                ? 'AI reconstruction has not started.'
                : 'AI reconstruction is unavailable because NVIDIA_API_KEY is not configured.'}
            </p>
            {initial.providerConfigured ? (
              <button
                className="primary-action"
                disabled={requesting}
                onClick={() => void requestReconstruction(false)}
                type="button"
              >
                {requesting ? 'Starting…' : 'Generate reconstruction'}
              </button>
            ) : null}
          </div>
        ) : null}
        {requestError ? (
          <div className="capture-note">{requestError}</div>
        ) : null}
        {initial.status === 'PENDING' ? (
          <div className="capture-note">AI reconstruction is pending…</div>
        ) : null}
        {initial.status === 'FAILED' && initial.record ? (
          <div className="capture-note">
            <p>
              AI reconstruction failed ({initial.record.failureCode}).{' '}
              {initial.record.failureMessage}
            </p>
            <button
              className="primary-action"
              disabled={requesting}
              onClick={() => void requestReconstruction(true)}
              type="button"
            >
              {requesting ? 'Retrying…' : 'Retry reconstruction'}
            </button>
          </div>
        ) : null}
        {initial.status === 'AVAILABLE' && initial.record?.content
          ? initial.record.content.statements.map((statement) => (
              <article className="timeline-item-card" key={statement.id}>
                <div className="timeline-item-header">
                  <div className="timeline-item-title">
                    <span className="event-badge badge-command">
                      {statement.claimBasis.replace('_', ' ')}
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
            ))
          : null}
      </div>
    </section>
  );
};
