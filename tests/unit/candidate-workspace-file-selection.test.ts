import { describe, expect, it } from 'vitest';

import { selectInitialWorkspaceFile } from '../../apps/web/app/candidate/[token]/candidate-workspace';

const workspaceFiles = [
  { path: 'src', size: 0, isDirectory: true },
  { path: 'src/zeta.ts', size: 1, isDirectory: false },
  { path: 'README.md', size: 1, isDirectory: false },
] as const;

describe('Candidate workspace file selection', () => {
  it('prefers the authoritative scenario file when it exists in the workspace', () => {
    expect(selectInitialWorkspaceFile(workspaceFiles, 'src/zeta.ts')).toBe(
      'src/zeta.ts',
    );
  });

  it('uses the deterministic first workspace file when the scenario path is absent or missing', () => {
    expect(selectInitialWorkspaceFile(workspaceFiles)).toBe('README.md');
    expect(selectInitialWorkspaceFile(workspaceFiles, 'missing/file.ts')).toBe(
      'README.md',
    );
    expect(selectInitialWorkspaceFile(workspaceFiles)).not.toBe(
      'inventory/service.py',
    );
  });

  it('does not select a path when the workspace has no files', () => {
    expect(
      selectInitialWorkspaceFile([{ path: 'src', size: 0, isDirectory: true }]),
    ).toBeUndefined();
  });
});
