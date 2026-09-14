import { describe, expect, it } from 'vitest';

import {
  createSubmittedDiff,
  normalizeLineEndings,
} from '../../apps/web/src/evidence/unified-diff';

describe('submitted diff', () => {
  it('normalizes CRLF and bare CR to LF', () => {
    expect(normalizeLineEndings('one\r\ntwo\rthree\n')).toBe(
      'one\ntwo\nthree\n',
    );
  });

  it('produces the same unified diff for equivalent line endings', () => {
    const fromCrlf = createSubmittedDiff(
      'src/example.ts',
      'const value = 1;\r\n',
      'const value = 2;\r\n',
    );
    const fromLf = createSubmittedDiff(
      'src/example.ts',
      'const value = 1;\n',
      'const value = 2;\n',
    );

    expect(fromCrlf).toBe(fromLf);
    expect(fromLf).toBe(
      [
        'Index: src/example.ts',
        '===================================================================',
        '--- src/example.ts\tscenario original',
        '+++ src/example.ts\tcandidate submission',
        '@@ -1,1 +1,1 @@',
        '-const value = 1;',
        '+const value = 2;',
        '',
      ].join('\n'),
    );
  });
});
