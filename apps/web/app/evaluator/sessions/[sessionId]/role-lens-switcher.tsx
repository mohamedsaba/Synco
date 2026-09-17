'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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

type RoleLensSwitcherProps = Readonly<{
  activeRole: BriefingDepthProfile;
}>;

export const RoleLensSwitcher = ({ activeRole }: RoleLensSwitcherProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createRoleHref = (role: BriefingDepthProfile) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('depth', role);
    return `${pathname ?? ''}?${params.toString()}`;
  };

  return (
    <nav className="role-lens-nav" aria-label="Evaluator perspective">
      <div className="role-lens-switcher">
        {briefingDepthProfiles.map((role) => {
          const isSelected = role === activeRole;
          return (
            <Link
              key={role}
              href={createRoleHref(role)}
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
