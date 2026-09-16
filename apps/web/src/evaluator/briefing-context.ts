import type { ScenarioSnapshot } from '../scenarios/slice-one-scenario';
import type { ContextEntry, PolicyGuidance } from './evaluator-briefing';
import { briefingContextSource } from './briefing-limitations';

export const buildBriefingTaskContext = (
  sessionId: string,
  scenario: ScenarioSnapshot,
): readonly ContextEntry[] => {
  const context = scenario.evaluationContext;
  return [
    {
      id: 'task-brief',
      category: 'task_context',
      kind: 'task_brief',
      source: briefingContextSource(
        sessionId,
        'scenario_snapshot',
        'brief',
        scenario.version,
      ),
      authoredText: scenario.brief,
    },
    ...(
      [
        'systemInvariants',
        'verificationTargets',
        'interpretationWarnings',
      ] as const
    ).flatMap((field) =>
      (context?.[field] ?? []).map((authoredText, index) => ({
        id: `context:${field}:${index}`,
        category: 'task_context' as const,
        kind: (
          {
            systemInvariants: 'system_invariant',
            verificationTargets: 'verification_area',
            interpretationWarnings: 'interpretation_warning',
          } as const
        )[field],
        source: briefingContextSource(
          sessionId,
          'evaluation_context',
          `evaluationContext.${field}[${index}]`,
          context!.version,
        ),
        authoredText,
      })),
    ),
  ];
};

export const buildBriefingReviewGuidance = (
  sessionId: string,
  scenario: ScenarioSnapshot,
): readonly PolicyGuidance[] =>
  scenario.evaluationContext?.reviewPolicy.map((authoredText, index) => ({
    id: `policy:${index}`,
    category: 'static_policy_context',
    source: briefingContextSource(
      sessionId,
      'evaluation_context',
      `evaluationContext.reviewPolicy[${index}]`,
      scenario.evaluationContext!.version,
    ),
    authoredText,
  })) ?? [];
