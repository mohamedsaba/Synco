import path from 'node:path';

import { isEvaluatorCookieValid } from '../access/evaluator-access';
import { EvaluatorAccessError } from '../access/evaluator-evidence';
import { getSessionService } from '../sessions/session-service';
import { scenario001 } from '../scenarios/scenario-001';
import { EvidenceReconstructionError } from './evidence-reconstruction';
import { EvidenceReconstructionService } from './evidence-reconstruction-service';
import { NvidiaNimEvidenceReconstructionGenerator } from './nvidia-nim-evidence-reconstruction-generator';
import { SqliteEvidenceReconstructionStore } from './sqlite-evidence-reconstruction-store';

const databasePath = () =>
  process.env.DELIMIT_DB_PATH ??
  path.join(process.cwd(), '.data/delimit.sqlite');

const createStore = () => new SqliteEvidenceReconstructionStore(databasePath());

export const createConfiguredEvidenceReconstructionService = () => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const sessionService = getSessionService();
  return new EvidenceReconstructionService(
    createStore(),
    new NvidiaNimEvidenceReconstructionGenerator(apiKey),
    (sessionId) => sessionService.getSubmittedEvidence(sessionId),
    { providerTimeoutMs: 60_000 },
  );
};

export const getAuthorizedReconstruction = (
  sessionId: string,
  evaluatorCookie: string | undefined,
) => {
  if (!isEvaluatorCookieValid(evaluatorCookie)) {
    throw new EvaluatorAccessError();
  }

  getSessionService().getSubmittedEvidence(sessionId);
  const record = createStore().getBySessionId(sessionId);
  const providerConfigured = Boolean(process.env.NVIDIA_API_KEY);
  if (!record) {
    return {
      status: 'NOT_STARTED' as const,
      record: null,
      providerConfigured,
    };
  }

  const { attemptToken, ...safeRecord } = record;
  void attemptToken;
  return { status: safeRecord.status, record: safeRecord, providerConfigured };
};

export const ensureAuthorizedReconstruction = async (
  sessionId: string,
  evaluatorCookie: string | undefined,
  retryFailed: boolean,
) => {
  if (!isEvaluatorCookieValid(evaluatorCookie)) {
    throw new EvaluatorAccessError();
  }
  const evidence = getSessionService().getSubmittedEvidence(sessionId);
  if (evidence.scenario.id !== scenario001.id) {
    throw new EvidenceReconstructionError(
      'SYNTHETIC_SCENARIO_REQUIRED',
      'NVIDIA NIM reconstruction is limited to synthetic Scenario 001 sessions.',
    );
  }
  const service = createConfiguredEvidenceReconstructionService();
  if (!service) {
    throw new EvidenceReconstructionError(
      'PROVIDER_NOT_CONFIGURED',
      'NVIDIA_API_KEY is not configured.',
    );
  }
  await service.ensure(sessionId, { retryFailed });
  return getAuthorizedReconstruction(sessionId, evaluatorCookie);
};

export const ensurePostSubmissionReconstruction = async (sessionId: string) => {
  const sessionService = getSessionService();
  const evidence = sessionService.getSubmittedEvidence(sessionId);
  if (evidence.scenario.id !== scenario001.id) return;

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return;
  const service = new EvidenceReconstructionService(
    createStore(),
    new NvidiaNimEvidenceReconstructionGenerator(apiKey),
    (id) => sessionService.getSubmittedEvidence(id),
    { providerTimeoutMs: 60_000 },
  );
  await service.ensure(sessionId);
};
