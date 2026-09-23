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
import { EngineerEvidenceWorkspace } from './engineer-evidence-workspace';
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
        submittedAt={review.session.submittedAt}
        closureReason={review.session.closureReason}
        activeRole={activeRole}
        searchParams={searchParams}
      />

      <nav className="evidence-hierarchy-nav" aria-label="Evidence hierarchy">
        <a href="#review-overview">Overview</a>
        <a href="#reconstruction">Reconstruction</a>
        {defaultDepth.technicalRecord ? (
          <a href="#engineer-inspection">Technical inspection</a>
        ) : (
          <a href="#submitted-changes">Final submitted state</a>
        )}
      </nav>

      <div className="evaluator-main-layout">
        <section id="review-overview" aria-labelledby="review-overview-title">
          <h2 className="section-kicker" id="review-overview-title">
            Overview
          </h2>
          <PlatformNotice
            limitations={
              defaultDepth.evidenceLimitations
                ? briefing.evidenceLimitations
                : []
            }
          />
          <TaskBrief
            taskContext={briefing.taskContext}
            showScenarioReference={defaultDepth.scenarioReference}
            contextAvailable={
              briefing.artifactAvailability.context === 'available'
            }
          />
        </section>

        {defaultDepth.technicalRecord ? (
          <EngineerEvidenceWorkspace
            activities={briefing.observedActivity}
            verification={briefing.recordedVerification}
            evidenceEntries={review.evidenceEntries}
            review={review}
            submittedState={briefing.submittedState}
            activatedAt={evidence.activatedAt}
            aiSummary={briefing.aiSummary}
          />
        ) : (
          <>
            <RecordedActivity
              activities={briefing.observedActivity}
              verification={briefing.recordedVerification}
              evidenceEntries={review.evidenceEntries}
              showDetailedTechnical={defaultDepth.technicalFootprint}
              showStructuredEvidence={defaultDepth.structuredEvidence}
              showDirectEvidenceLinks={defaultDepth.directEvidenceLinks}
              showVerificationChronology={defaultDepth.verificationChronology}
              aiSummary={
                defaultDepth.aiSummary ? briefing.aiSummary : undefined
              }
              showConfiguredModel={defaultDepth.aiConfiguredModel}
              showTokenTelemetry={defaultDepth.aiTokenTelemetry}
              activatedAt={evidence.activatedAt}
            />

            <SubmittedWork
              submittedState={briefing.submittedState}
              diff={review.submittedDiff}
              prominentDiff={!defaultDepth.conciseSubmissionScope}
            />
          </>
        )}

        {defaultDepth.reviewGuidance ? (
          <ReviewGuidance guidance={briefing.reviewGuidance} />
        ) : null}

        {defaultDepth.artifactAvailability ? (
          <ArtifactAvailabilityCard
            availability={briefing.artifactAvailability}
            provenance={briefing.provenance}
            showTechnicalDetails={defaultDepth.technicalRecord}
          />
        ) : null}
      </div>
    </div>
  );
};
