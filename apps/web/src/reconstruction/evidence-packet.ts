import { createHash } from 'node:crypto';

import type { ReconstructionItem } from '../evidence/chronological-reconstruction';
import type { CommandFinishedPayload } from '../events/session-event';
import type {
  EvidenceReferenceCatalog,
  EvidenceCatalogEntry,
} from './evidence-reference-catalog';
import { EvidenceReconstructionError } from './evidence-reconstruction';
import {
  initialReconstructionLimits,
  type ReconstructionLimits,
} from './reconstruction-limits';

export type CoverageAnchorKind =
  | 'submission_boundary'
  | 'workspace_gap'
  | 'out_of_band_change'
  | 'workspace_transition'
  | 'reversion'
  | 'unsuccessful_command_before_further_work'
  | 'final_observed_command'
  | 'final_state';

export type CoverageAnchor = Readonly<{
  id: string;
  kind: CoverageAnchorKind;
  evidenceRefs: readonly string[];
}>;

export type ModelEvidenceItem = Readonly<{
  evidenceRef: string;
  role: 'chronology';
  chronologyOrder: number;
  kind: Exclude<EvidenceCatalogEntry['kind'], 'final_diff'>;
  fact: Readonly<Record<string, unknown>>;
}>;

export type EvidencePacketV1 = Readonly<{
  schemaVersion: 1;
  scenario: Readonly<{
    title: string;
    candidateBrief: string;
    candidateAcceptanceCriteria: readonly string[];
  }>;
  session: Readonly<{
    activatedAt: string | null;
    submittedAt: string;
  }>;
  evidenceItems: readonly ModelEvidenceItem[];
  finalDiff: Readonly<{
    evidenceRef: string;
    excerpt: string;
    excerptBytes: number;
    totalBytes: number;
    truncated: boolean;
    sha256: string;
  }>;
  integrity: Readonly<{
    workspaceGapRefs: readonly string[];
    outOfBandChangeRefs: readonly string[];
    truncatedEvidenceRefs: readonly string[];
  }>;
  coverageAnchors: readonly CoverageAnchor[];
}>;

export type EvidencePacketSource = Readonly<{
  scenario: Readonly<{
    title: string;
    brief: string;
    acceptanceCriteria: readonly string[];
  }>;
  activatedAt: string | null;
  submittedAt: string;
  diff: string;
}>;

const byteLength = (value: string) => Buffer.byteLength(value, 'utf8');

const truncateUtf8 = (value: string, maximumBytes: number) => {
  if (byteLength(value) <= maximumBytes) return value;

  let result = '';
  for (const character of value) {
    if (byteLength(result + character) > maximumBytes) break;
    result += character;
  }
  return result;
};

const boundedText = (value: string, maximumBytes: number) => ({
  excerpt: truncateUtf8(value, maximumBytes),
  totalBytes: byteLength(value),
});

const modelFact = (
  item: ReconstructionItem,
  limits: ReconstructionLimits,
): Readonly<Record<string, unknown>> | null => {
  if (item.kind === 'SESSION_ACTIVATED') {
    return { boundary: 'session_activated', timestamp: item.timestamp };
  }
  if (item.kind === 'SESSION_SUBMITTED') {
    return { boundary: 'session_submitted', timestamp: item.timestamp };
  }
  if (item.kind === 'COMMAND_EXECUTION') {
    const rawFinished = item.rawFinishedEvent.payload as CommandFinishedPayload;
    const stdout = boundedText(
      item.stdoutPreview,
      limits.maximumCommandOutputBytes,
    );
    const stderr = boundedText(
      item.stderrPreview,
      limits.maximumCommandOutputBytes,
    );
    return {
      command: item.command,
      cwd: item.cwd,
      exitCode: item.exitCode,
      timedOut: item.timedOut,
      durationMs: item.durationMs,
      stdoutExcerpt: stdout.excerpt,
      stdoutBytes: rawFinished.stdoutBytes,
      stdoutTruncated:
        rawFinished.stdoutTruncated || stdout.excerpt !== item.stdoutPreview,
      stderrExcerpt: stderr.excerpt,
      stderrBytes: rawFinished.stderrBytes,
      stderrTruncated:
        rawFinished.stderrTruncated || stderr.excerpt !== item.stderrPreview,
    };
  }
  if (item.kind === 'WORKSPACE_CHANGE') {
    return {
      origin: item.origin,
      observation:
        item.origin === 'out_of_band'
          ? 'Workspace changed between recorded actions.'
          : 'Workspace transition observed.',
      beforeTree: item.beforeTree,
      afterTree: item.afterTree,
      files: item.files.map((file) => {
        const patch = boundedText(file.patchPreview, limits.maximumPatchBytes);
        return {
          path: file.path,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patchExcerpt: patch.excerpt,
          patchBytes: file.patchBytes,
          patchTruncated:
            file.patchTruncated || patch.excerpt !== file.patchPreview,
        };
      }),
      totalAdditions: item.totalAdditions,
      totalDeletions: item.totalDeletions,
    };
  }
  if (item.kind === 'WORKSPACE_GAP') {
    return {
      observation: 'Workspace evidence is incomplete for this interval.',
      phase: item.phase,
      commandId: item.commandId,
    };
  }
  return null;
};

const createAnchors = (
  catalog: EvidenceReferenceCatalog,
  submittedDiff: string,
): readonly CoverageAnchor[] => {
  const anchors: Omit<CoverageAnchor, 'id'>[] = [];
  const chronology = catalog.entries.filter(
    (entry) => entry.chronologyOrder !== null,
  );
  const workspaceEntries = chronology.filter(
    (entry) => entry.kind === 'workspace_change',
  );
  const seenTrees = new Set<string>();

  for (const entry of chronology) {
    if (entry.kind === 'submission') {
      anchors.push({
        kind: 'submission_boundary',
        evidenceRefs: [entry.evidenceRef],
      });
      continue;
    }
    if (entry.kind === 'evidence_gap') {
      anchors.push({
        kind: 'workspace_gap',
        evidenceRefs: [entry.evidenceRef],
      });
      continue;
    }
    if (
      entry.kind === 'workspace_change' &&
      entry.item?.kind === 'WORKSPACE_CHANGE'
    ) {
      anchors.push({
        kind: 'workspace_transition',
        evidenceRefs: [entry.evidenceRef],
      });
      if (entry.item.origin === 'out_of_band') {
        anchors.push({
          kind: 'out_of_band_change',
          evidenceRefs: [entry.evidenceRef],
        });
      }
      if (seenTrees.has(entry.item.afterTree)) {
        anchors.push({ kind: 'reversion', evidenceRefs: [entry.evidenceRef] });
      }
      seenTrees.add(entry.item.beforeTree);
      seenTrees.add(entry.item.afterTree);
      continue;
    }
    if (
      entry.kind === 'command_execution' &&
      entry.item?.kind === 'COMMAND_EXECUTION'
    ) {
      const laterWorkspaceChange = workspaceEntries.some(
        (workspace) =>
          (workspace.chronologyOrder ?? -1) >
          (entry.chronologyOrder ?? Number.MAX_SAFE_INTEGER),
      );
      if (
        (entry.item.timedOut || entry.item.exitCode !== 0) &&
        laterWorkspaceChange
      ) {
        anchors.push({
          kind: 'unsuccessful_command_before_further_work',
          evidenceRefs: [entry.evidenceRef],
        });
      }
    }
  }

  const commands = chronology.filter(
    (entry) => entry.kind === 'command_execution',
  );
  const finalCommand = commands.at(-1);
  if (finalCommand) {
    anchors.push({
      kind: 'final_observed_command',
      evidenceRefs: [finalCommand.evidenceRef],
    });
  }

  const finalDiff = catalog.entries.find(
    (entry) => entry.kind === 'final_diff',
  );
  if (finalDiff && submittedDiff.trim().length > 0) {
    anchors.push({
      kind: 'final_state',
      evidenceRefs: [finalDiff.evidenceRef],
    });
  }

  return anchors.map((anchor, index) => ({
    id: `anchor_${String(index + 1).padStart(3, '0')}`,
    ...anchor,
  }));
};

export const buildEvidencePacket = (
  source: EvidencePacketSource,
  catalog: EvidenceReferenceCatalog,
  limits: ReconstructionLimits = initialReconstructionLimits,
): EvidencePacketV1 => {
  const chronologyEntries = catalog.entries.filter(
    (entry) => entry.role === 'chronology' && entry.item !== null,
  );
  if (chronologyEntries.length > limits.maximumEvidenceItems) {
    throw new EvidenceReconstructionError(
      'INPUT_TOO_LARGE',
      'The evidence chronology exceeds the reconstruction item limit.',
    );
  }

  const evidenceItems = chronologyEntries.flatMap((entry) => {
    const fact = modelFact(entry.item!, limits);
    if (!fact || entry.chronologyOrder === null) return [];
    return [
      {
        evidenceRef: entry.evidenceRef,
        role: 'chronology' as const,
        chronologyOrder: entry.chronologyOrder,
        kind: entry.kind as Exclude<EvidenceCatalogEntry['kind'], 'final_diff'>,
        fact,
      },
    ];
  });
  const finalDiffExcerpt = boundedText(
    source.diff,
    limits.maximumFinalDiffBytes,
  );
  const finalDiffRef = `session:${catalog.sessionId}:final-diff`;
  const anchors = createAnchors(catalog, source.diff);
  const requiredReferences = new Set(
    anchors.flatMap((anchor) => anchor.evidenceRefs),
  );
  if (
    requiredReferences.size >
    limits.maximumStatements * limits.maximumReferencesPerStatement
  ) {
    throw new EvidenceReconstructionError(
      'COVERAGE_UNSATISFIABLE',
      'Required coverage references cannot fit within the output bounds.',
    );
  }
  const truncatedEvidenceRefs = evidenceItems.flatMap((item) => {
    const encoded = JSON.stringify(item.fact);
    return encoded.includes('"stdoutTruncated":true') ||
      encoded.includes('"stderrTruncated":true') ||
      encoded.includes('"patchTruncated":true')
      ? [item.evidenceRef]
      : [];
  });

  const packet: EvidencePacketV1 = {
    schemaVersion: 1,
    scenario: {
      title: source.scenario.title,
      candidateBrief: source.scenario.brief,
      candidateAcceptanceCriteria: source.scenario.acceptanceCriteria,
    },
    session: {
      activatedAt: source.activatedAt,
      submittedAt: source.submittedAt,
    },
    evidenceItems,
    finalDiff: {
      evidenceRef: finalDiffRef,
      excerpt: finalDiffExcerpt.excerpt,
      excerptBytes: byteLength(finalDiffExcerpt.excerpt),
      totalBytes: finalDiffExcerpt.totalBytes,
      truncated: finalDiffExcerpt.excerpt !== source.diff,
      sha256: createHash('sha256').update(source.diff).digest('hex'),
    },
    integrity: {
      workspaceGapRefs: catalog.entries
        .filter((entry) => entry.kind === 'evidence_gap')
        .map((entry) => entry.evidenceRef),
      outOfBandChangeRefs: catalog.entries
        .filter(
          (entry) =>
            entry.item?.kind === 'WORKSPACE_CHANGE' &&
            entry.item.origin === 'out_of_band',
        )
        .map((entry) => entry.evidenceRef),
      truncatedEvidenceRefs,
    },
    coverageAnchors: anchors,
  };

  if (byteLength(JSON.stringify(packet)) > limits.maximumPacketBytes) {
    throw new EvidenceReconstructionError(
      'INPUT_TOO_LARGE',
      'The bounded evidence packet exceeds the aggregate size limit.',
    );
  }

  return packet;
};

export const digestEvidencePacket = (packet: EvidencePacketV1) =>
  createHash('sha256').update(JSON.stringify(packet)).digest('hex');
