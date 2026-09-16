import type {
  ArtifactAvailability,
  BriefingProvenance,
} from '../../../../src/evaluator/evaluator-briefing';

type ArtifactAvailabilityCardProps = Readonly<{
  availability: ArtifactAvailability;
  provenance: BriefingProvenance;
  showTechnicalDetails?: boolean;
}>;

export const ArtifactAvailabilityCard = ({
  availability,
  provenance,
  showTechnicalDetails = false,
}: ArtifactAvailabilityCardProps) => {
  return (
    <section
      className="review-section artifact-availability-section"
      aria-labelledby="artifact-availability-title"
    >
      <header className="review-section-heading">
        <p className="section-kicker">System state</p>
        <h2 id="artifact-availability-title">Artifact availability</h2>
        <p>Verification status of authoritative assessment artifacts.</p>
      </header>

      <div className="artifact-status-grid">
        <div className="artifact-status-item">
          <span className="artifact-key">Briefing:</span>
          <span className="status-badge-inline status-available">
            available
          </span>
        </div>
        <div className="artifact-status-item">
          <span className="artifact-key">Submitted diff:</span>
          <span className="status-badge-inline status-available">
            available
          </span>
        </div>
        <div className="artifact-status-item">
          <span className="artifact-key">Reconstruction:</span>
          <span className="status-badge-inline status-available">
            {availability.reconstruction.toLowerCase()}
          </span>
        </div>
        <div className="artifact-status-item">
          <span className="artifact-key">Scenario context:</span>
          <span
            className={`status-badge-inline status-${availability.context}`}
          >
            {availability.context}
          </span>
        </div>
        <div className="artifact-status-item">
          <span className="artifact-key">Semantic metadata:</span>
          <span
            className={`status-badge-inline status-${availability.semantics}`}
          >
            {availability.semantics}
          </span>
        </div>
      </div>

      {showTechnicalDetails ? (
        <div className="artifact-provenance-details">
          <h3 className="provenance-heading">
            Cryptographic & Schema Provenance
          </h3>
          <dl className="provenance-dl">
            {provenance.authoritativeEvidenceSha256 ? (
              <div>
                <dt>Evidence SHA-256</dt>
                <dd>
                  <code>{provenance.authoritativeEvidenceSha256}</code>
                </dd>
              </div>
            ) : null}
            {provenance.finalDiffSha256 ? (
              <div>
                <dt>Final diff SHA-256</dt>
                <dd>
                  <code>{provenance.finalDiffSha256}</code>
                </dd>
              </div>
            ) : null}
            {provenance.reconstruction?.generatorVersion ? (
              <div>
                <dt>Reconstruction engine</dt>
                <dd>
                  <code>{provenance.reconstruction.generatorVersion}</code>
                </dd>
              </div>
            ) : null}
            {provenance.builderVersion ? (
              <div>
                <dt>Briefing builder</dt>
                <dd>
                  <code>{provenance.builderVersion}</code>
                </dd>
              </div>
            ) : null}
            {provenance.mapperVersion ? (
              <div>
                <dt>Semantic mapper</dt>
                <dd>
                  <code>{provenance.mapperVersion}</code>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </section>
  );
};
