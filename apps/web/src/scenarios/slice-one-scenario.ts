export type ScenarioSnapshot = Readonly<{
  id: string;
  version: string;
  title: string;
  brief: string;
  acceptanceCriteria: readonly string[];
  filePath: string;
  originalContent: string;
  type?: 'single_file' | 'multi_file';
  imageName?: string;
}>;

export const sliceOneScenario: ScenarioSnapshot = {
  id: 'slice-1-greeting-format',
  version: '1.0.0',
  title: 'Trim customer names in greetings',
  brief:
    'Customer names copied from an import can contain surrounding whitespace. The greeting formatter currently preserves it, producing visibly uneven messages. Update the formatter so greetings use the customer name without surrounding whitespace.',
  acceptanceCriteria: [
    'Remove whitespace before and after the customer name.',
    'Preserve characters and whitespace inside the customer name.',
    'Keep the existing “Hello …” greeting format.',
  ],
  filePath: 'src/format-greeting.ts',
  originalContent: [
    'export const formatGreeting = (name: string) => {',
    '  return `Hello ${name}`;',
    '};',
    '',
  ].join('\n'),
};
