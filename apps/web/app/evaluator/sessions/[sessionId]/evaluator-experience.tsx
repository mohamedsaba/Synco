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
import { RecordedActivity } from './recorded-activity';
import { SubmittedWork } from './submitted-work';
import { ReviewGuidance } from './review-guidance';
import { ArtifactAvailabilityCard } from './artifact-availability-card';
import { TechnicalRecord } from './technical-record';
import type { RoleLensSearchParams } from './role-lens-switcher';

type EvaluatorExperienceProps = Readonly<{
  sessionId: string;
  evidence: EvaluatorReviewEvidence;
  review: EvaluatorReviewPresentation;
  projection: ProjectedBriefing;
  activeRole: BriefingDepthProfile;
  searchParams?: RoleLensSearchParams;
}>;

export const EvaluatorExperience = ({
  sessionId,
  evidence,
  review,
  projection,
  activeRole,
  searchParams,
}: EvaluatorExperienceProps) => {
  const { briefing, defaultDepth } = projection;

  return (
    <div className="evaluator-v2-container" data-role-lens={activeRole}>
      <EvaluatorHeader
        sessionId={sessionId}
        scenarioTitle={evidence.scenario.title}
        sessionDuration={briefing.sessionDuration}
        submittedAt={evidence.submittedAt}
        closureReason={evidence.closureReason}
        activeRole={activeRole}
        searchParams={searchParams}
      />

      <nav className="evidence-hierarchy-nav" aria-label="Evidence hierarchy">
        <a href="#review-overview">Overview</a>
        <a href="#reconstruction">Reconstruction</a>
        <a href="#submitted-changes">Final submitted state</a>
        {defaultDepth.technicalRecord ? (
          <a href="#technical-record">Source evidence</a>
        ) : null}
      </nav>

      <div className="evaluator-main-layout">
        <section id="review-overview" aria-label="Review overview">
          <PlatformNotice limitations={briefing.evidenceLimitations} />
          <TaskBrief
            taskContext={briefing.taskContext}
            showScenarioReference={defaultDepth.scenarioReference}
            contextAvailable={
              briefing.artifactAvailability.context === 'available'
            }
          />
        </section>

        <RecordedActivity
          activities={briefing.observedActivity}
          verification={briefing.recordedVerification}
          evidenceEntries={review.evidenceEntries}
          showDetailedTechnical={defaultDepth.technicalFootprint}
          aiSummary={defaultDepth.aiSummary ? briefing.aiSummary : undefined}
          showConfiguredModel={defaultDepth.aiConfiguredModel}
          showTokenTelemetry={defaultDepth.aiTokenTelemetry}
          activeRole={activeRole}
          activatedAt={evidence.activatedAt}
        />

        <SubmittedWork
          submittedState={briefing.submittedState}
          diff={review.submittedDiff}
          prominentDiff={!defaultDepth.conciseSubmissionScope}
        />

        {defaultDepth.reviewGuidance ? (
          <ReviewGuidance guidance={briefing.reviewGuidance} />
        ) : null}

        {defaultDepth.artifactAvailability ? (
          <ArtifactAvailabilityCard
            availability={briefing.artifactAvailability}
            provenance={briefing.provenance}
            showTechnicalDetails={activeRole === 'ENGINEER'}
          />
        ) : null}

        {defaultDepth.technicalRecord ? (
          <div
            className="technical-record-wrapper technical-record-prominent"
            id="technical-record"
          >
            <TechnicalRecord
              review={review}
              activatedAt={evidence.activatedAt}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
