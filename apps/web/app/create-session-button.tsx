'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const CreateSessionButton = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: 'scenario-001-cache-staleness' }),
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
        onClick={createSession}
        type="button"
      >
        {isCreating ? 'Creating session…' : 'Start Scenario 001 incident'}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
};
