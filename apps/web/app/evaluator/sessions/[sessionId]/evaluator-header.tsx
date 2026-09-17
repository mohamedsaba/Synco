import Link from 'next/link';
import type { BriefingDepthProfile } from '../../../../src/evaluator/project-evaluator-briefing';
import type { BriefingSessionDuration } from '../../../../src/evaluator/evaluator-briefing';
import {
  RoleLensSwitcher,
  type RoleLensSearchParams,
} from './role-lens-switcher';

type EvaluatorHeaderProps = Readonly<{
  sessionId: string;
  scenarioTitle: string;
  sessionDuration?: BriefingSessionDuration;
  submittedAt: string;
  activeRole: BriefingDepthProfile;
  searchParams?: RoleLensSearchParams;
}>;

export const EvaluatorHeader = ({
  sessionId,
  scenarioTitle,
  sessionDuration,
  submittedAt,
  activeRole,
  searchParams,
}: EvaluatorHeaderProps) => {
  return (
    <header className="evaluator-v2-header">
      <div className="evaluator-brand-bar">
        <div className="evaluator-brand">
          <span className="brand-mark" aria-hidden="true">
            ◩
          </span>
          <span className="brand-name">Delimit</span>
          <span className="brand-separator">/</span>
          <span className="brand-product">Evaluator Briefing</span>
        </div>
        <div className="header-actions">
          <Link className="text-link exit-link" href="/evaluator">
            ← Review another session
          </Link>
        </div>
      </div>

      <div className="evaluator-title-block">
        <div className="title-metadata-pill">
          <span
            className="status-indicator status-submitted"
            title={`Submitted at ${submittedAt}`}
          >
            Submitted
          </span>
          {sessionDuration?.status === 'available' ? (
            <span
              className="duration-indicator"
              title={`Elapsed time: ${sessionDuration.elapsedMs}ms`}
            >
              {sessionDuration.text} recorded
            </span>
          ) : null}
          <span
            className="session-tag"
            title={`Candidate session reference: ${sessionId}`}
          >
            Session {sessionId.slice(0, 8)}…
          </span>
        </div>

        <h1 className="evaluator-scenario-title">{scenarioTitle}</h1>
        <p className="evaluator-subtitle">
          Recorded engineering activity, grounded evidence, and submitted
          changes for human evaluation.
        </p>
      </div>

      <div className="header-lens-control">
        <RoleLensSwitcher
          activeRole={activeRole}
          sessionId={sessionId}
          searchParams={searchParams}
        />
      </div>
    </header>
  );
};
