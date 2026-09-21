/**
 * ============================================================================
 * CANDIDATE TIMING & CLOCK CALIBRATION (C1 CONTRACT)
 * ============================================================================
 *
 * Rules:
 * 1. The browser clock is never authoritative.
 * 2. Clock calibration calculates an offset against authoritative serverTime:
 *      offsetMs = parsedServerTimeMs - estimatedLocalTimeAtServerResponse
 * 3. Midpoint calibration:
 *      estimatedLocalTime = requestStartedAt + (responseReceivedAt - requestStartedAt) / 2
 * 4. Calibrated current time:
 *      calibratedNow = Date.now() + offsetMs
 * 5. Remaining time is ALWAYS derived from (deadline - calibratedNow):
 *      - Never decremented as an authoritative local counter.
 *      - No counting missed setInterval ticks.
 *      - Tab backgrounding and sleep recover automatically on the next Date.now() read.
 *      - Remaining ms is strictly clamped at zero (Math.max(0, diff)).
 * 6. Legacy untimed sessions (deadline === null) return remainingMs = null.
 */

export type ClockCalibration = Readonly<{
  offsetMs: number;
  lastCalibratedAtMs: number;
}>;

export const INITIAL_CLOCK_CALIBRATION: ClockCalibration = {
  offsetMs: 0,
  lastCalibratedAtMs: 0,
};

export type CalibrateClockInput = Readonly<{
  serverTime?: string | null;
  requestStartedAtMs?: number;
  responseReceivedAtMs?: number;
  localReceiptTimeMs?: number;
}>;

/**
 * Computes the client-to-server clock offset using server-authoritative time.
 * Uses network midpoint calibration when request timing metadata is available.
 */
export const calibrateClock = (
  input: CalibrateClockInput,
): ClockCalibration => {
  const localNow = input.localReceiptTimeMs ?? Date.now();

  if (!input.serverTime) {
    return {
      offsetMs: 0,
      lastCalibratedAtMs: localNow,
    };
  }

  const parsedServerMs = Date.parse(input.serverTime);
  if (Number.isNaN(parsedServerMs)) {
    return {
      offsetMs: 0,
      lastCalibratedAtMs: localNow,
    };
  }

  let estimatedLocalAtServerResponse = localNow;
  if (
    typeof input.requestStartedAtMs === 'number' &&
    typeof input.responseReceivedAtMs === 'number' &&
    input.responseReceivedAtMs >= input.requestStartedAtMs
  ) {
    const roundTripMs = input.responseReceivedAtMs - input.requestStartedAtMs;
    estimatedLocalAtServerResponse =
      input.requestStartedAtMs + Math.round(roundTripMs / 2);
  }

  const offsetMs = parsedServerMs - estimatedLocalAtServerResponse;

  return {
    offsetMs,
    lastCalibratedAtMs: localNow,
  };
};

/**
 * Returns calibrated current time in milliseconds since epoch.
 */
export const getCalibratedNow = (
  calibration: ClockCalibration,
  localNowMs: number = Date.now(),
): number => localNowMs + calibration.offsetMs;

/**
 * Derives the remaining milliseconds before session deadline.
 *
 * Rules:
 * - If deadline is null (untimed or unactivated), returns null.
 * - If deadline is invalid, returns null.
 * - Otherwise returns clamped milliseconds (>= 0).
 */
export const calculateRemainingMs = (
  deadline: string | null,
  calibratedNowMs: number,
): number | null => {
  if (deadline === null) {
    return null;
  }

  const deadlineMs = Date.parse(deadline);
  if (Number.isNaN(deadlineMs)) {
    return null;
  }

  const diffMs = deadlineMs - calibratedNowMs;
  return Math.max(0, diffMs);
};

/**
 * Evaluates whether calibrated current time has reached or passed the deadline.
 *
 * Rules:
 * - If deadline is null, returns false.
 * - Returns true if calibratedNowMs >= deadlineMs.
 */
export const isProjectedDeadlineReached = (
  deadline: string | null,
  calibratedNowMs: number,
): boolean => {
  if (deadline === null) {
    return false;
  }

  const deadlineMs = Date.parse(deadline);
  if (Number.isNaN(deadlineMs)) {
    return false;
  }

  return calibratedNowMs >= deadlineMs;
};
