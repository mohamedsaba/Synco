import type { EvaluatorBriefing } from './evaluator-briefing';
import { briefingProjectionVersion } from './build-evaluator-briefing';

export const briefingDepthProfiles = [
  'GENERALIST_RECRUITER',
  'TECHNICAL_RECRUITER',
  'ENGINEER',
  'ENGINEERING_MANAGER',
] as const;
export type BriefingDepthProfile = (typeof briefingDepthProfiles)[number];
const depth = {
  GENERALIST_RECRUITER: {
    structuredEvidence: false,
    technicalRecord: false,
    scenarioReference: false,
  },
  TECHNICAL_RECRUITER: {
    structuredEvidence: true,
    technicalRecord: false,
    scenarioReference: true,
  },
  ENGINEER: {
    structuredEvidence: true,
    technicalRecord: true,
    scenarioReference: true,
  },
  ENGINEERING_MANAGER: {
    structuredEvidence: true,
    technicalRecord: false,
    scenarioReference: true,
  },
} as const;

export const projectBriefing = (
  briefing: EvaluatorBriefing,
  profile: BriefingDepthProfile,
) => {
  if (!briefingDepthProfiles.includes(profile))
    throw new Error('Unsupported briefing depth profile.');
  return {
    schemaVersion: 1 as const,
    projectionVersion: briefingProjectionVersion,
    profile,
    briefing,
    defaultDepth: depth[profile],
    // All profiles retain the full index and direct source access. Expansion is presentation only.
    expandedEvidenceRefs: depth[profile].technicalRecord
      ? briefing.evidenceIndex.map((entry) => entry.evidenceRef)
      : [],
  };
};
