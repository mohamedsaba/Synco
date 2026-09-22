import type { SessionClosureReason } from '../sessions/session';

export const evaluatorReviewLimit = 50;

export type EvaluatorReviewEntry = Readonly<{
  sessionId: string;
  scenarioTitle: string;
  submittedAt: string;
  durationSeconds: number | null;
  closureReason: SessionClosureReason;
}>;

export type EvaluatorReviewQueue = Readonly<{
  sessions: readonly EvaluatorReviewEntry[];
}>;
