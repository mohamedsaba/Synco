import type { ReconstructionItem } from '../evidence/chronological-reconstruction';
import type { EvidenceRole } from './evidence-reconstruction';

export type EvidenceCatalogKind =
  | 'activation'
  | 'command_execution'
  | 'workspace_change'
  | 'evidence_gap'
  | 'submission'
  | 'final_diff';

export type EvidenceCatalogEntry = Readonly<{
  evidenceRef: string;
  sessionId: string;
  role: EvidenceRole;
  kind: EvidenceCatalogKind;
  chronologyOrder: number | null;
  firstSequence: number | null;
  lastSequence: number | null;
  rawEventIds: readonly string[];
  item: ReconstructionItem | null;
}>;

export type EvidenceReferenceCatalog = Readonly<{
  sessionId: string;
  entries: readonly EvidenceCatalogEntry[];
  byReference: ReadonlyMap<string, EvidenceCatalogEntry>;
  submissionOrder: number;
}>;

const commandEntry = (
  sessionId: string,
  item: Extract<ReconstructionItem, { kind: 'COMMAND_EXECUTION' }>,
  chronologyOrder: number,
): EvidenceCatalogEntry => ({
  evidenceRef: `command:${sessionId}:${item.commandId}`,
  sessionId,
  role: 'chronology',
  kind: 'command_execution',
  chronologyOrder,
  firstSequence: item.rawStartedEvent?.sequence ?? item.sequence,
  lastSequence: item.sequence,
  rawEventIds: [item.rawStartedEventId, item.rawFinishedEventId],
  item,
});

export const buildEvidenceReferenceCatalog = (
  sessionId: string,
  reconstruction: readonly ReconstructionItem[],
): EvidenceReferenceCatalog => {
  const entries: EvidenceCatalogEntry[] = [];
  let submissionOrder = reconstruction.length;

  reconstruction.forEach((item, chronologyOrder) => {
    if (item.kind === 'SESSION_ACTIVATED') {
      entries.push({
        evidenceRef: `session:${sessionId}:activated`,
        sessionId,
        role: 'chronology',
        kind: 'activation',
        chronologyOrder,
        firstSequence: null,
        lastSequence: null,
        rawEventIds: [],
        item,
      });
      return;
    }

    if (item.kind === 'COMMAND_EXECUTION') {
      entries.push(commandEntry(sessionId, item, chronologyOrder));
      return;
    }

    if (item.kind === 'WORKSPACE_CHANGE' || item.kind === 'WORKSPACE_GAP') {
      entries.push({
        evidenceRef: `event:${sessionId}:${item.rawEventId}`,
        sessionId,
        role: 'chronology',
        kind:
          item.kind === 'WORKSPACE_CHANGE'
            ? 'workspace_change'
            : 'evidence_gap',
        chronologyOrder,
        firstSequence: item.sequence,
        lastSequence: item.sequence,
        rawEventIds: [item.rawEventId],
        item,
      });
      return;
    }

    if (item.kind === 'SESSION_SUBMITTED') {
      submissionOrder = chronologyOrder;
      entries.push({
        evidenceRef: `session:${sessionId}:submitted`,
        sessionId,
        role: 'chronology',
        kind: 'submission',
        chronologyOrder,
        firstSequence: null,
        lastSequence: null,
        rawEventIds: [],
        item,
      });
    }
  });

  entries.push({
    evidenceRef: `session:${sessionId}:final-diff`,
    sessionId,
    role: 'final_state',
    kind: 'final_diff',
    chronologyOrder: null,
    firstSequence: null,
    lastSequence: null,
    rawEventIds: [],
    item: null,
  });

  return {
    sessionId,
    entries,
    byReference: new Map(entries.map((entry) => [entry.evidenceRef, entry])),
    submissionOrder,
  };
};
