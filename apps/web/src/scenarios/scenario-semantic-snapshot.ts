import { z } from 'zod';
import { conservativeReadTarget } from './conservative-command-binding';

// These labels are authoring vocabulary, never candidate-controlled narrative.
export const semanticSubjectLabels = [
  'inventory database',
  'storefront cache',
  'inventory service code',
  'storefront read code',
  'code associated with inventory updates',
  'greeting formatter code',
] as const;

const identifier = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
const boundedText = z.string().min(1).max(500);
const readBinding = z
  .object({
    id: identifier,
    subjectId: identifier,
    operation: z.literal('read'),
    // Exact argv includes the target; no substring or executable-only match.
    argv: z.array(boundedText).min(2).max(20),
    cwd: z.literal('/workspace'),
    wordingKey: z.literal('bound_read'),
  })
  .strict();

const semanticSchema = z
  .object({
    schemaVersion: z.literal(1),
    contentVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    subjects: z
      .array(
        z
          .object({ id: identifier, label: z.enum(semanticSubjectLabels) })
          .strict(),
      )
      .max(30),
    pathBindings: z
      .array(
        z
          .object({
            id: identifier,
            subjectId: identifier,
            prefix: z.string().regex(/^[a-zA-Z0-9_./-]{1,200}$/),
            classification: z.enum(['application', 'test', 'documentation']),
            wordingKey: z.literal('related_edit'),
          })
          .strict(),
      )
      .max(50),
    commandBindings: z.array(readBinding).max(30),
  })
  .strict()
  .superRefine((value, context) => {
    const subjects = new Set(value.subjects.map((subject) => subject.id));
    const rules = [...value.pathBindings, ...value.commandBindings];
    if (
      subjects.size !== value.subjects.length ||
      new Set(rules.map((rule) => rule.id)).size !== rules.length ||
      rules.some((rule) => !subjects.has(rule.subjectId)) ||
      value.commandBindings.some((rule) => {
        const target = conservativeReadTarget(rule.argv);
        const label = value.subjects.find(
          (subject) => subject.id === rule.subjectId,
        )?.label;
        return (
          target === null ||
          label !==
            (target === 'cache' ? 'storefront cache' : 'inventory database')
        );
      }) ||
      value.pathBindings.some((rule) =>
        rule.prefix.split('/').some((segment) => segment === '..'),
      )
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Invalid semantic bindings.',
      });
    }
  });

export type ScenarioSemanticSnapshot = z.infer<typeof semanticSchema>;
export type SemanticSnapshotRead =
  | { status: 'available'; snapshot: ScenarioSemanticSnapshot }
  | { status: 'absent' | 'unsupported' };

export const readScenarioSemanticSnapshot = (
  value: unknown,
): SemanticSnapshotRead => {
  if (value === undefined || value === null) return { status: 'absent' };
  const parsed = semanticSchema.safeParse(value);
  return parsed.success
    ? { status: 'available', snapshot: parsed.data }
    : { status: 'unsupported' };
};

export const cloneScenarioSemanticSnapshot = (value: unknown) =>
  value === undefined
    ? undefined
    : semanticSchema.parse(structuredClone(value));

export const decodeStoredSemanticSnapshot = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    // Preserve a malformed stored value for explicit unsupported fallback.
    return value;
  }
};

export const scenario001SemanticSnapshot: ScenarioSemanticSnapshot = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  subjects: [
    { id: 'database', label: 'inventory database' },
    { id: 'cache', label: 'storefront cache' },
    { id: 'service', label: 'inventory service code' },
  ],
  pathBindings: [
    {
      id: 'inventory-service',
      subjectId: 'service',
      prefix: 'inventory/service.py',
      classification: 'application',
      wordingKey: 'related_edit',
    },
  ],
  commandBindings: [
    {
      id: 'storefront-stock-read',
      subjectId: 'cache',
      argv: ['redis-cli', 'get', 'stock:wh-east-01:PROD-1001'],
      cwd: '/workspace',
      operation: 'read',
      wordingKey: 'bound_read',
    },
    {
      id: 'inventory-quantity-read',
      subjectId: 'database',
      argv: [
        'psql',
        '-h',
        '127.0.0.1',
        '-U',
        'hirearchy',
        '-d',
        'inventory',
        '-t',
        '-A',
        '-c',
        "SELECT quantity FROM inventory WHERE warehouse_id='WH-EAST-01' AND product_id='PROD-1001';",
      ],
      cwd: '/workspace',
      operation: 'read',
      wordingKey: 'bound_read',
    },
  ],
};
