'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const CreateSessionButton = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async (scenarioId?: string) => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      if (!response.ok) {
        throw new Error('The assessment session could not be created.');
      }

      const result = (await response.json()) as { candidatePath: string };
      router.push(result.candidatePath);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The assessment session could not be created.',
      );
      setIsCreating(false);
    }
  };

  return (
    <div className="action-stack">
      <button
        className="button button-primary"
        disabled={isCreating}
        onClick={() => createSession('scenario-001-cache-staleness')}
        type="button"
      >
        {isCreating ? 'Creating session…' : 'Start Scenario 001 incident'}
      </button>
      <button
        className="button button-secondary"
        disabled={isCreating}
        onClick={() => createSession('slice-1-greeting-format')}
        type="button"
        style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem' }}
      >
        Start single-file fixture
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
};
