'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const EvaluatorAccessForm = () => {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [credential, setCredential] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const openEvidence = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/evaluator/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!response.ok) {
        const result = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(result.error?.message ?? 'Evaluator access failed.');
      }

      router.push(
        `/evaluator/sessions/${encodeURIComponent(sessionId.trim())}`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Evaluator access failed.',
      );
      setIsBusy(false);
    }
  };

  return (
    <form className="access-form" onSubmit={openEvidence}>
      <label>
        Session ID
        <input
          autoComplete="off"
          onChange={(event) => setSessionId(event.target.value)}
          required
          value={sessionId}
        />
      </label>
      <label>
        Evaluator credential
        <input
          autoComplete="current-password"
          onChange={(event) => setCredential(event.target.value)}
          required
          type="password"
          value={credential}
        />
      </label>
      <button className="button button-primary" disabled={isBusy} type="submit">
        {isBusy ? 'Checking access…' : 'Open evidence'}
      </button>
      {error ? (
        <p className="form-error" aria-live="polite">
          {error}
        </p>
      ) : null}
    </form>
  );
};
