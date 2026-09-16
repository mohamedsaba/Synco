'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type SummaryLifecycleControlProps = Readonly<{
  sessionId: string;
  reconstructionStatus: 'NOT_STARTED' | 'PENDING' | 'FAILED';
}>;

export const SummaryLifecycleControl = ({
  sessionId,
  reconstructionStatus,
}: SummaryLifecycleControlProps) => {
  const router = useRouter();
  const started = useRef(false);
  const [requesting, setRequesting] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);

  const requestSummary = useCallback(
    async (retryFailed: boolean) => {
      setRequesting(true);
      setRequestFailed(false);
      try {
        const response = await fetch(
          `/api/evaluator/sessions/${sessionId}/reconstruction`,
          retryFailed
            ? {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ retryFailed: true }),
              }
            : { method: 'POST' },
        );
        if (!response.ok) {
          setRequestFailed(true);
          return;
        }
        router.refresh();
      } catch {
        setRequestFailed(true);
      } finally {
        setRequesting(false);
      }
    },
    [router, sessionId],
  );

  useEffect(() => {
    if (reconstructionStatus === 'NOT_STARTED' && !started.current) {
      started.current = true;
      void requestSummary(false);
      return;
    }
    if (reconstructionStatus !== 'PENDING') return;
    const refresh = window.setTimeout(() => router.refresh(), 3_000);
    return () => window.clearTimeout(refresh);
  }, [reconstructionStatus, requestSummary, router]);

  const unavailable = reconstructionStatus === 'FAILED' || requestFailed;
  if (unavailable) {
    return (
      <div className="summary-state" role="alert">
        <p className="summary-state-title">
          The session summary isn&apos;t available right now.
        </p>
        <p>Recorded activity and submitted changes remain available.</p>
        <button
          className="review-action"
          disabled={requesting}
          onClick={() => void requestSummary(reconstructionStatus === 'FAILED')}
          type="button"
        >
          {requesting ? 'Trying again…' : 'Try again'}
        </button>
      </div>
    );
  }

  return (
    <div className="summary-state" role="status" aria-live="polite">
      <p className="summary-state-title">Preparing the session summary…</p>
      <p>Recorded activity and submitted changes are available below.</p>
      <span className="summary-progress" aria-hidden="true" />
    </div>
  );
};
