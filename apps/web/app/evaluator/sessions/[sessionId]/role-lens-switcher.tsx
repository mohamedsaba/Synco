'use client';

import { useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  onRoleChange?: (role: BriefingDepthProfile) => void;
}>;

export const RoleLensSwitcher = ({
  activeRole,
  onRoleChange,
}: RoleLensSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleRoleSelect = useCallback(
    (role: BriefingDepthProfile) => {
      if (onRoleChange) {
        onRoleChange(role);
      }
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('depth', role);
      router.push(`${pathname ?? ''}?${params.toString()}`);
    },
    [router, pathname, searchParams, onRoleChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = briefingDepthProfiles.indexOf(activeRole);
      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % briefingDepthProfiles.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        nextIndex =
          (currentIndex - 1 + briefingDepthProfiles.length) %
          briefingDepthProfiles.length;
      } else if (event.key === 'Home') {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        nextIndex = briefingDepthProfiles.length - 1;
      }

      if (nextIndex !== currentIndex) {
        handleRoleSelect(briefingDepthProfiles[nextIndex]);
      }
    },
    [activeRole, handleRoleSelect],
  );

  return (
    <nav className="role-lens-nav" aria-label="Evaluator perspective lenses">
      <div
        className="role-lens-switcher"
        role="tablist"
        aria-label="Evaluation depth profiles"
        onKeyDown={handleKeyDown}
      >
        {briefingDepthProfiles.map((role) => {
          const isSelected = role === activeRole;
          return (
            <button
              key={role}
              role="tab"
              type="button"
              id={`lens-tab-${role}`}
              aria-selected={isSelected}
              aria-controls={`lens-panel-${role}`}
              tabIndex={isSelected ? 0 : -1}
              className={`lens-tab ${isSelected ? 'lens-tab-active' : ''}`}
              onClick={() => handleRoleSelect(role)}
              title={roleDescriptions[role]}
            >
              <span className="lens-tab-name">{roleLabels[role]}</span>
            </button>
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
