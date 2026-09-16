import type { EvidenceLimitation } from '../../../../src/evaluator/evaluator-briefing';

type PlatformNoticeProps = Readonly<{
  limitations: readonly EvidenceLimitation[];
}>;

export const PlatformNotice = ({ limitations }: PlatformNoticeProps) => {
  // Only display material platform notices that the evaluator needs to know
  const materialLimitations = limitations.filter((limitation) => {
    if ('kind' in limitation) {
      return (
        limitation.kind === 'workspace_capture_gap' ||
        limitation.kind === 'missing_context' ||
        limitation.kind === 'unsupported_semantics'
      );
    }
    return false;
  });

  if (materialLimitations.length === 0) return null;

  return (
    <div
      className="platform-notices-container"
      role="region"
      aria-label="Platform and observation notices"
    >
      {materialLimitations.map((limitation) => {
        const isCaptureGap =
          'kind' in limitation && limitation.kind === 'workspace_capture_gap';
        const isMissingContext =
          'kind' in limitation && limitation.kind === 'missing_context';

        return (
          <aside
            key={limitation.id}
            className={`platform-notice-card ${
              isCaptureGap ? 'platform-notice-gap' : 'platform-notice-info'
            }`}
            aria-live="polite"
          >
            <div className="platform-notice-badge">
              <span className="notice-icon" aria-hidden="true">
                ℹ
              </span>
              <span className="notice-type">
                {isCaptureGap
                  ? 'Activity capture incomplete'
                  : isMissingContext
                    ? 'Historical session note'
                    : 'Observation limitation'}
              </span>
            </div>
            <p className="platform-notice-text">{limitation.text}</p>
          </aside>
        );
      })}
    </div>
  );
};
