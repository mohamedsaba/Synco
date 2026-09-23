import { scenario001 } from './scenario-001';
import type { ScenarioSnapshot } from './slice-one-scenario';

const issuableScenarios = [scenario001] as const;

export const getIssuableScenario = (
  scenarioId: string,
): ScenarioSnapshot | undefined =>
  issuableScenarios.find((scenario) => scenario.id === scenarioId);
