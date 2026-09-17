import type { UrlObject } from 'url';
import Link from 'next/link';
import type { BriefingDepthProfile } from '../../../../src/evaluator/project-evaluator-briefing';
import { briefingDepthProfiles } from '../../../../src/evaluator/project-evaluator-briefing';

const roleLabels: Record<BriefingDepthProfile, string> = {
  GENERALIST_RECRUITER: 'Generalist Recruiter',
  TECHNICAL_RECRUITER: 'Technical Recruiter',
  ENGINEER: 'Engineer',
  ENGINEERING_MANAGER: 'Engineering Manager',
};

const roleDescriptions: Record<BriefingDepthProfile, string> = {
  GENERALIST_RECRUITER:
    '10–20s executive summary, plain-English activity, and neutral verification',
  TECHNICAL_RECRUITER:
    'Technical footprint, recorded tooling, and chronological progression',
  ENGINEER:
    'Full technical workspace, code diffs, command lines, and raw execution logs',
  ENGINEERING_MANAGER:
    'Synthesis view, submission scope, limitation disclosures, and review policy',
};

export type RoleLensSearchParams =
  Record<string, string | string[] | undefined> | URLSearchParams;

export const buildRoleLensHref = (
  role: BriefingDepthProfile,
  options?: {
    sessionId?: string;
    searchParams?: RoleLensSearchParams;
  },
): UrlObject => {
  const query: Record<string, string | string[]> = {};

  if (options?.searchParams) {
    if (options.searchParams instanceof URLSearchParams) {
      options.searchParams.forEach((value, key) => {
        if (key !== 'depth' && key !== 'role') {
          query[key] = value;
        }
      });
    } else {
      for (const [key, value] of Object.entries(options.searchParams)) {
        if (key === 'depth' || key === 'role' || value === undefined) continue;
        query[key] = value;
      }
    }
  }

  query.depth = role;

  return {
    ...(options?.sessionId
      ? { pathname: `/evaluator/sessions/${options.sessionId}` }
      : {}),
    query,
  };
};

type RoleLensSwitcherProps = Readonly<{
  activeRole: BriefingDepthProfile;
  sessionId?: string;
  searchParams?: RoleLensSearchParams;
}>;

export const RoleLensSwitcher = ({
  activeRole,
  sessionId,
  searchParams,
}: RoleLensSwitcherProps) => {
  return (
    <nav className="role-lens-nav" aria-label="Evaluator perspective">
      <div className="role-lens-switcher">
        {briefingDepthProfiles.map((role) => {
          const isSelected = role === activeRole;
          return (
            <Link
              key={role}
              href={buildRoleLensHref(role, { sessionId, searchParams })}
              aria-current={isSelected ? 'page' : undefined}
              className={`lens-tab ${isSelected ? 'lens-tab-active' : ''}`}
              title={roleDescriptions[role]}
            >
              <span className="lens-tab-name">{roleLabels[role]}</span>
            </Link>
          );
        })}
      </div>
      <p className="lens-description" aria-live="polite">
        <span className="visually-hidden">Current lens description: </span>
        {roleDescriptions[activeRole]}
      </p>
    </nav>
  );
};
