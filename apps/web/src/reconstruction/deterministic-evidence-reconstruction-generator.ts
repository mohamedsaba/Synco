import {
  renderChronologyFact,
  renderFinalDiff,
  renderWorkspaceProgression,
  type DeterministicStatementTrace,
} from './deterministic-reconstruction-renderer';
import type { EvidencePacketV1 } from './evidence-packet';
import { EvidenceReconstructionError } from './evidence-reconstruction';
import type {
  EvidenceReconstructionGenerator,
  GeneratedReconstruction,
} from './evidence-reconstruction-generator';
import { initialReconstructionLimits } from './reconstruction-limits';

export type { DeterministicStatementTrace } from './deterministic-reconstruction-renderer';

export const deterministicReconstructionProviderId = 'hirearchy-deterministic';
export const deterministicReconstructionVersion =
  'evaluator-reconstruction-deterministic-v3';

export const buildDeterministicReconstruction = (packet: EvidencePacketV1) => {
  const itemsByReference = new Map(
    packet.evidenceItems.map((item) => [item.evidenceRef, item]),
  );
  const units: Array<{
    items: Array<(typeof packet.evidenceItems)[number]>;
    anchorKinds: Set<string>;
  }> = [];
  const unitByReference = new Map<string, (typeof units)[number]>();
  let includeFinalDiff = false;

  for (const anchor of packet.coverageAnchors) {
    if (anchor.kind === 'final_state') {
      includeFinalDiff = true;
      continue;
    }
    const existing = anchor.evidenceRefs
      .map((reference) => unitByReference.get(reference))
      .filter((unit) => unit !== undefined);
    if (existing.length > 0) {
      if (
        existing.length !== anchor.evidenceRefs.length ||
        new Set(existing).size !== 1
      ) {
        throw new EvidenceReconstructionError(
          'COVERAGE_UNSATISFIABLE',
          'Overlapping deterministic coverage groups cannot be represented atomically.',
        );
      }
      existing[0].anchorKinds.add(anchor.kind);
      continue;
    }
    const items = anchor.evidenceRefs.flatMap((reference) => {
      const item = itemsByReference.get(reference);
      return item ? [item] : [];
    });
    if (items.length !== anchor.evidenceRefs.length) {
      throw new EvidenceReconstructionError(
        'INVALID_EVIDENCE_REFERENCE',
        'A deterministic coverage reference is not present in the evidence packet.',
      );
    }
    const unit = { items, anchorKinds: new Set([anchor.kind]) };
    units.push(unit);
    for (const reference of anchor.evidenceRefs) {
      unitByReference.set(reference, unit);
    }
  }

  for (const item of packet.evidenceItems) {
    if (
      units.length + (includeFinalDiff ? 1 : 0) <
        initialReconstructionLimits.maximumStatements &&
      !unitByReference.has(item.evidenceRef) &&
      item.fact.kind === 'command_execution' &&
      item.fact.output?.kind === 'test_summary'
    ) {
      const unit = { items: [item], anchorKinds: new Set<string>() };
      units.push(unit);
      unitByReference.set(item.evidenceRef, unit);
    }
  }

  if (
    units.length + (includeFinalDiff ? 1 : 0) >
    initialReconstructionLimits.maximumStatements
  ) {
    throw new EvidenceReconstructionError(
      'COVERAGE_UNSATISFIABLE',
      'Material deterministic boundaries exceed the Candidate Work statement limit after safe workspace aggregation.',
    );
  }

  units.sort(
    (left, right) =>
      Math.min(...left.items.map((item) => item.chronologyOrder)) -
      Math.min(...right.items.map((item) => item.chronologyOrder)),
  );
  const traces: DeterministicStatementTrace[] = units.map((unit) =>
    unit.anchorKinds.has('workspace_progression') && unit.items.length > 1
      ? renderWorkspaceProgression(unit.items)
      : renderChronologyFact(unit.items[0], unit.anchorKinds),
  );
  if (includeFinalDiff) {
    traces.push(renderFinalDiff(packet));
  }

  return {
    traces,
    output: {
      schemaVersion: 1 as const,
      statements: traces.map(({ text, detail, claimBasis, evidenceRefs }) => ({
        text,
        ...(detail ? { detail } : {}),
        claimBasis,
        evidenceRefs,
      })),
    },
  };
};

export class DeterministicEvidenceReconstructionGenerator implements EvidenceReconstructionGenerator {
  readonly providerId = deterministicReconstructionProviderId;
  readonly modelId = deterministicReconstructionVersion;
  readonly versionId = deterministicReconstructionVersion;

  async generate(packet: EvidencePacketV1): Promise<GeneratedReconstruction> {
    return {
      output: buildDeterministicReconstruction(packet).output,
      providerId: this.providerId,
      modelId: this.modelId,
    };
  }
}
