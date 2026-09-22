import type { BriefingAiSummary } from '../../../../src/evaluator/evaluator-briefing';
type CompactAiSummaryProps = Readonly<{
  summary: BriefingAiSummary;
  showConfiguredModel?: boolean;
  showInterleaving?: boolean;
}>;

export const CompactAiSummary = ({
  summary,
  showConfiguredModel = false,
  showInterleaving = false,
}: CompactAiSummaryProps) => {
  return (
    <aside
      className={`compact-ai-summary compact-ai-summary-${summary.capabilityState}`}
      aria-label="AI capability summary"
    >
      <div className="ai-summary-header">
        <span className="ai-summary-badge">
          {summary.capabilityState === 'legacy'
            ? 'AI capture'
            : 'AI capability'}
        </span>
        <p className="ai-summary-text">{summary.summaryText}</p>
        {showConfiguredModel && summary.configuredModelId ? (
          <span className="ai-summary-model">
            Model:{' '}
            <code className="code-inline">{summary.configuredModelId}</code>
          </span>
        ) : null}
      </div>

      {summary.providerInterruptionNotice ? (
        <p className="ai-summary-notice">
          {summary.providerInterruptionNotice}
        </p>
      ) : null}

      {summary.interleaved && showInterleaving ? (
        <p className="ai-summary-interleaving">
          Recorded AI activity was interleaved with terminal commands and
          workspace changes.
        </p>
      ) : null}
    </aside>
  );
};
