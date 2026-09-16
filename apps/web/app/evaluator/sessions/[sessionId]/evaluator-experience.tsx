import type {
  BriefingDepthProfile,
  ProjectedBriefing,
} from '../../../../src/evaluator/project-evaluator-briefing';
import type {
  EvaluatorReviewEvidence,
  EvaluatorReviewPresentation,
} from '../../../../src/evaluator/evaluator-review-presentation';
import { EvaluatorHeader } from './evaluator-header';
import { PlatformNotice } from './platform-notice';
import { TaskBrief } from './task-brief';
import { VerificationSummary } from './verification-summary';
import { RecordedActivity } from './recorded-activity';
import { SubmittedWork } from './submitted-work';
import { ReviewGuidance } from './review-guidance';
import { ArtifactAvailabilityCard } from './artifact-availability-card';
import { TechnicalRecord } from './technical-record';

type EvaluatorExperienceProps = Readonly<{
  sessionId: string;
  evidence: EvaluatorReviewEvidence;
  review: EvaluatorReviewPresentation;
  projection: ProjectedBriefing;
  activeRole: BriefingDepthProfile;
}>;

export const EvaluatorExperience = ({
  sessionId,
  evidence,
  review,
  projection,
  activeRole,
}: EvaluatorExperienceProps) => {
  const { briefing, defaultDepth } = projection;

  return (
    <div className="evaluator-v2-container" data-role-lens={activeRole}>
      <EvaluatorHeader
        sessionId={sessionId}
        scenarioTitle={evidence.scenario.title}
        sessionDuration={briefing.sessionDuration}
        submittedAt={evidence.submittedAt}
        activeRole={activeRole}
      />

      <section
        id={`lens-panel-${activeRole}`}
        role="tabpanel"
        aria-labelledby={`lens-tab-${activeRole}`}
        tabIndex={0}
        className="evaluator-main-layout"
      >
        {/* Platform Limitation Notices */}
        <PlatformNotice limitations={briefing.evidenceLimitations} />

        {/* 1. Task Context */}
        <TaskBrief
          taskContext={briefing.taskContext}
          showScenarioReference={defaultDepth.scenarioReference}
          contextAvailable={
            briefing.artifactAvailability.context === 'available'
          }
        />

        {/* 2. Recorded Verification Progression */}
        <VerificationSummary
          verification={briefing.recordedVerification}
          showChronology={defaultDepth.verificationChronology}
        />

        {/* 3. Observed Activity Feed */}
        <RecordedActivity
          activities={briefing.observedActivity}
          evidenceEntries={review.evidenceEntries}
          showDetailedTechnical={defaultDepth.technicalFootprint}
        />

        {/* 4. Submitted Code Changes */}
        <SubmittedWork
          submittedState={briefing.submittedState}
          diff={review.submittedDiff}
          prominentDiff={!defaultDepth.conciseSubmissionScope}
        />

        {/* 5. Evaluation Guidance / Policy */}
        {defaultDepth.reviewGuidance ? (
          <ReviewGuidance guidance={briefing.reviewGuidance} />
        ) : null}

        {/* 6. Artifact Availability & System Provenance */}
        {defaultDepth.artifactAvailability ? (
          <ArtifactAvailabilityCard
            availability={briefing.artifactAvailability}
            provenance={briefing.provenance}
            showTechnicalDetails={activeRole === 'ENGINEER'}
          />
        ) : null}

        {/* 7. Technical Record / Deep Chronology (mounted only when enabled in default depth) */}
        {defaultDepth.technicalRecord ? (
          <div className="technical-record-wrapper technical-record-prominent">
            <TechnicalRecord
              review={review}
              activatedAt={evidence.activatedAt}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
};
