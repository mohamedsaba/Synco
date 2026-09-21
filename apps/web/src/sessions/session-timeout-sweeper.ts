import { getSessionService, type SessionService } from './session-service';

export const SESSION_TIMEOUT_SWEEP_INTERVAL_MS = 1_000;

const GLOBAL_SWEEPER_KEY = Symbol.for('delimit.sessionTimeoutSweeper');

type SweeperState = {
  timer: NodeJS.Timeout;
  running: boolean;
};

export const startSessionTimeoutSweeper = (
  service: SessionService = getSessionService(),
  intervalMs = SESSION_TIMEOUT_SWEEP_INTERVAL_MS,
) => {
  const target = globalThis as unknown as {
    [GLOBAL_SWEEPER_KEY]?: SweeperState;
  };
  if (target[GLOBAL_SWEEPER_KEY]) return;

  const state: SweeperState = {
    running: false,
    timer: setInterval(() => {
      if (state.running) return;
      state.running = true;
      void service
        .sweepTimedOutSessions()
        .catch((error) => console.error('Session timeout sweep failed', error))
        .finally(() => {
          state.running = false;
        });
    }, intervalMs),
  };
  state.timer.unref();
  target[GLOBAL_SWEEPER_KEY] = state;
};
