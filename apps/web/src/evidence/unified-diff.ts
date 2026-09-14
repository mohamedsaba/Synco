import { createTwoFilesPatch } from 'diff';

export const normalizeLineEndings = (content: string) =>
  content.replace(/\r\n?/g, '\n');

export const createSubmittedDiff = (
  filePath: string,
  originalContent: string,
  submittedContent: string,
) =>
  createTwoFilesPatch(
    filePath,
    filePath,
    normalizeLineEndings(originalContent),
    normalizeLineEndings(submittedContent),
    'scenario original',
    'candidate submission',
    { context: 3 },
  );
