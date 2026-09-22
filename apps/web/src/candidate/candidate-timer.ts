export type CandidateTimerState = 'NORMAL' | 'ATTENTION' | 'URGENT' | 'EXPIRED';

export type CandidateTimerPresentation = Readonly<{
  display: string;
  state: CandidateTimerState;
  statusText: string | null;
}>;

export const TIMER_ATTENTION_MS = 5 * 60 * 1_000;
export const TIMER_URGENT_MS = 60 * 1_000;

export const presentCandidateTimer = (
  remainingMs: number | null,
  durationSeconds: number | null,
): CandidateTimerPresentation | null => {
  if (remainingMs === null) return null;

  const remainingSeconds = Math.ceil(Math.max(0, remainingMs) / 1_000);
  const hours = Math.floor(remainingSeconds / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;
  const includeHours = (durationSeconds ?? 0) >= 3_600;
  const display = includeHours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (remainingSeconds === 0) {
    return { display, state: 'EXPIRED', statusText: 'Time limit reached.' };
  }
  if (remainingMs <= TIMER_URGENT_MS) {
    return {
      display,
      state: 'URGENT',
      statusText: '1 minute or less remaining.',
    };
  }
  if (remainingMs <= TIMER_ATTENTION_MS) {
    return { display, state: 'ATTENTION', statusText: '5 minutes remaining.' };
  }
  return { display, state: 'NORMAL', statusText: null };
};
