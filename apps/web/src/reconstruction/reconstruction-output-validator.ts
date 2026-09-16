import { z } from 'zod';

import type { EvidenceReferenceCatalog } from './evidence-reference-catalog';
import type { EvidencePacketV1 } from './evidence-packet';
import {
  EvidenceReconstructionError,
  type EvidenceReconstructionContentV1,
  type ReconstructionStatement,
} from './evidence-reconstruction';
import {
  initialReconstructionLimits,
  type ReconstructionLimits,
} from './reconstruction-limits';

const createOutputSchema = (limits: ReconstructionLimits) =>
  z
    .object({
      schemaVersion: z.literal(1),
      statements: z
        .array(
          z
            .object({
              text: z
                .string()
                .trim()
                .min(1)
                .max(limits.maximumStatementTextLength),
              detail: z
                .string()
                .trim()
                .min(1)
                .max(limits.maximumStatementDetailLength)
                .optional(),
              claimBasis: z.enum(['chronology', 'final_state']),
              evidenceRefs: z
                .array(z.string().trim().min(1))
                .min(1)
                .max(limits.maximumReferencesPerStatement),
            })
            .strict(),
        )
        .min(1)
        .max(limits.maximumStatements),
    })
    .strict();

export const reconstructionOutputJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'integer', enum: [1] },
    statements: {
      type: 'array',
      minItems: 1,
      maxItems: initialReconstructionLimits.maximumStatements,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: {
            type: 'string',
            minLength: 1,
            maxLength: initialReconstructionLimits.maximumStatementTextLength,
          },
          detail: {
            type: 'string',
            minLength: 1,
            maxLength: initialReconstructionLimits.maximumStatementDetailLength,
          },
          claimBasis: {
            type: 'string',
            enum: ['chronology', 'final_state'],
          },
          evidenceRefs: {
            type: 'array',
            minItems: 1,
            maxItems: initialReconstructionLimits.maximumReferencesPerStatement,
            items: { type: 'string' },
          },
        },
        required: ['text', 'claimBasis', 'evidenceRefs'],
      },
    },
  },
  required: ['schemaVersion', 'statements'],
} as const;

const invalidOutput = (message: string) =>
  new EvidenceReconstructionError('MALFORMED_OUTPUT', message);

const requireInterveningGapReferences = (
  catalog: EvidenceReferenceCatalog,
  firstEvidenceOrder: number,
  lastEvidenceOrder: number,
  statementReferences: ReadonlySet<string>,
) => {
  const missingGap = catalog.entries.find(
    (entry) =>
      entry.kind === 'evidence_gap' &&
      entry.chronologyOrder !== null &&
      entry.chronologyOrder > firstEvidenceOrder &&
      entry.chronologyOrder < lastEvidenceOrder &&
      !statementReferences.has(entry.evidenceRef),
  );
  if (missingGap) {
    throw new EvidenceReconstructionError(
      'INVALID_EVIDENCE_REFERENCE',
      'A cross-gap statement must cite every intervening evidence gap.',
    );
  }
};

export const validateReconstructionOutput = (
  output: unknown,
  packet: EvidencePacketV1,
  catalog: EvidenceReferenceCatalog,
  limits: ReconstructionLimits = initialReconstructionLimits,
): EvidenceReconstructionContentV1 => {
  let outputBytes: number;
  try {
    outputBytes = Buffer.byteLength(JSON.stringify(output), 'utf8');
  } catch {
    throw invalidOutput('The provider output is not JSON serializable.');
  }
  if (outputBytes > limits.maximumOutputBytes) {
    throw invalidOutput(
      'The provider output exceeds the aggregate size limit.',
    );
  }

  const parsed = createOutputSchema(limits).safeParse(output);
  if (!parsed.success) {
    throw invalidOutput('The provider output does not match schema version 1.');
  }

  const citedReferences = new Set<string>();
  const statements = parsed.data.statements.map(
    (statement, modelArrayIndex) => {
      if (
        !/[.!?]["']?$/.test(statement.text) ||
        statement.text.endsWith('...')
      ) {
        throw invalidOutput(
          'Reconstruction statements must be complete sentences ending with terminal punctuation.',
        );
      }

      const uniqueReferences = new Set(statement.evidenceRefs);
      if (uniqueReferences.size !== statement.evidenceRefs.length) {
        throw new EvidenceReconstructionError(
          'INVALID_EVIDENCE_REFERENCE',
          'Duplicate references inside one statement are not allowed.',
        );
      }

      const entries = statement.evidenceRefs.map((evidenceRef) => {
        const entry = catalog.byReference.get(evidenceRef);
        if (!entry || entry.sessionId !== catalog.sessionId) {
          throw new EvidenceReconstructionError(
            'INVALID_EVIDENCE_REFERENCE',
            'A reconstruction reference is unknown or belongs to another session.',
          );
        }
        citedReferences.add(evidenceRef);
        return entry;
      });

      const chronologyEntries = entries.filter(
        (entry) =>
          entry.role === 'chronology' && entry.chronologyOrder !== null,
      );
      if (
        statement.claimBasis === 'chronology' &&
        chronologyEntries.length === 0
      ) {
        throw new EvidenceReconstructionError(
          'INVALID_EVIDENCE_REFERENCE',
          'A chronology claim requires chronology evidence.',
        );
      }
      if (
        statement.claimBasis === 'final_state' &&
        entries.some((entry) => entry.role !== 'final_state')
      ) {
        throw new EvidenceReconstructionError(
          'INVALID_EVIDENCE_REFERENCE',
          'A final-state claim may cite only final-state evidence.',
        );
      }

      const firstEvidenceOrder =
        chronologyEntries.length > 0
          ? Math.min(
              ...chronologyEntries.map((entry) => entry.chronologyOrder!),
            )
          : catalog.submissionOrder;
      const lastEvidenceOrder =
        chronologyEntries.length > 0
          ? Math.max(
              ...chronologyEntries.map((entry) => entry.chronologyOrder!),
            )
          : firstEvidenceOrder;
      requireInterveningGapReferences(
        catalog,
        firstEvidenceOrder,
        lastEvidenceOrder,
        uniqueReferences,
      );

      return { statement, firstEvidenceOrder, modelArrayIndex };
    },
  );

  const missingAnchor = packet.coverageAnchors.find((anchor) =>
    anchor.evidenceRefs.some(
      (evidenceRef) => !citedReferences.has(evidenceRef),
    ),
  );
  if (missingAnchor) {
    throw new EvidenceReconstructionError(
      'COVERAGE_UNSATISFIABLE',
      `Required coverage anchor ${missingAnchor.id} is not represented.`,
    );
  }

  const ordered = statements.toSorted(
    (left, right) =>
      left.firstEvidenceOrder - right.firstEvidenceOrder ||
      left.modelArrayIndex - right.modelArrayIndex,
  );
  const persistedStatements: ReconstructionStatement[] = ordered.map(
    ({ statement, firstEvidenceOrder }, index) => ({
      id: `stmt_${String(index + 1).padStart(3, '0')}`,
      text: statement.text,
      ...(statement.detail ? { detail: statement.detail } : {}),
      claimBasis: statement.claimBasis,
      evidenceRefs: statement.evidenceRefs,
      firstEvidenceOrder,
    }),
  );

  return { schemaVersion: 1, statements: persistedStatements };
};
