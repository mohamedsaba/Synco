import type { AiCapabilitySnapshot } from '../ai/ai-interaction';
import { scenario001, scenario001AiCapability } from './scenario-001';
import type { ScenarioSnapshot } from './slice-one-scenario';

export type IssuableScenario = Readonly<{
  scenario: ScenarioSnapshot;
  aiCapability: AiCapabilitySnapshot;
}>;

const issuableScenarios: readonly IssuableScenario[] = [
  {
    scenario: scenario001,
    aiCapability: scenario001AiCapability,
  },
];

export const getIssuableScenario = (
  scenarioId: string,
): IssuableScenario | undefined =>
  issuableScenarios.find(({ scenario }) => scenario.id === scenarioId);
