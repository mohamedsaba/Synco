'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CandidateTimingProjection } from '../sessions/session-timing';
import type {
  CandidateEphemeralUiMode,
  CandidateFinalizationState,
  ServerAuthoritativeCandidateSession,
} from './candidate-experience-state';
import { projectCandidateExperience } from './candidate-projection';
import {
  calibrateClock,
  getCalibratedNow,
  type ClockCalibration,
} from './candidate-timing';

export type UseCandidateSessionProps<
  TSession extends ServerAuthoritativeCandidateSession,
> = Readonly<{
  initialSession: TSession;
  token: string;
  tickIntervalMs?: number;
}>;

export const useCandidateSession = <
  TSession extends ServerAuthoritativeCandidateSession,
>({
  initialSession,
  token,
  tickIntervalMs = 500,
}: UseCandidateSessionProps<TSession>) => {
  // 1. Server-authoritative truth received from server responses
  const [serverSession, setServerSession] = useState<TSession>(initialSession);

  // 2. Ephemeral UI states
  const [uiMode, setUiMode] = useState<CandidateEphemeralUiMode>('entry');
  const [finalizationState, setFinalizationState] =
    useState<CandidateFinalizationState>('idle');

  // 3. Clock calibration offset
  const [clockCalibration, setClockCalibration] = useState<ClockCalibration>(
    () =>
      calibrateClock({
        serverTime: initialSession.serverTime,
        localReceiptTimeMs: Date.now(),
      }),
  );

  // 4. Local clock ticker to drive derived countdown presentation
  const [localNowMs, setLocalNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    // Timer only needs to tick while session is active or pre-active
    const timer = setInterval(() => {
      setLocalNowMs(Date.now());
    }, tickIntervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [tickIntervalMs]);

  // Calibration helper when new server responses arrive
  const updateServerSession = useCallback(
    (
      nextSession: TSession,
      timingMeta?: {
        requestStartedAtMs?: number;
        responseReceivedAtMs?: number;
      },
    ) => {
      setServerSession(nextSession);
      if (nextSession.serverTime) {
        setClockCalibration(
          calibrateClock({
            serverTime: nextSession.serverTime,
            requestStartedAtMs: timingMeta?.requestStartedAtMs,
            responseReceivedAtMs: timingMeta?.responseReceivedAtMs,
            localReceiptTimeMs: timingMeta?.responseReceivedAtMs ?? Date.now(),
          }),
        );
      }
    },
    [],
  );

  // Authoritative background timing synchronization
  const syncTiming = useCallback(async () => {
    try {
      const requestStartedAtMs = Date.now();
      const res = await fetch(`/api/candidate/sessions/${token}/timing`);
      const responseReceivedAtMs = Date.now();

      if (res.ok) {
        const timing = (await res.json()) as CandidateTimingProjection;
        setClockCalibration(
          calibrateClock({
            serverTime: timing.serverTime,
            requestStartedAtMs,
            responseReceivedAtMs,
          }),
        );

        // If backend status changed (e.g. sweeper timeout-finalized the session)
        setServerSession((prev) => {
          if (
            prev.status !== timing.status ||
            prev.closureReason !== timing.closureReason
          ) {
            return {
              ...prev,
              status: timing.status,
              closureReason: timing.closureReason,
              activatedAt: timing.activatedAt,
              durationSeconds: timing.durationSeconds,
              deadline: timing.deadline,
              serverTime: timing.serverTime,
            };
          }
          return prev;
        });
      }
    } catch {
      // Ignore background timing sync failure
    }
  }, [token]);

  // Derived calibrated current time
  const calibratedNowMs = useMemo(
    () => getCalibratedNow(clockCalibration, localNowMs),
    [clockCalibration, localNowMs],
  );

  // Pure deterministic candidate UX projection
  const projection = useMemo(
    () =>
      projectCandidateExperience({
        serverSession,
        calibratedNowMs,
        uiMode,
        finalizationState,
      }),
    [serverSession, calibratedNowMs, uiMode, finalizationState],
  );

  return {
    serverSession,
    projection,
    calibratedNowMs,
    clockCalibration,
    uiMode,
    finalizationState,
    setUiMode,
    setFinalizationState,
    updateServerSession,
    syncTiming,
  };
};
