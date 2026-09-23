import { describe, expect, it } from 'vitest';

import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';

describe('Workspace file boundary', () => {
  it('permits contained files and rejects escaping symlink targets', async () => {
    const sessionId = `workspace-boundary-${Date.now()}`;
    const adapter = new DockerSandboxAdapter();

    try {
      await adapter.createAndVerify(sessionId, {
        'inside.txt': 'inside\n',
        'real-directory/existing.txt': 'existing\n',
      });

      expect(await adapter.readFile(sessionId, 'inside.txt')).toBe('inside\n');
      await adapter.writeFile(sessionId, 'inside.txt', 'updated\n');
      expect(await adapter.readFile(sessionId, 'inside.txt')).toBe('updated\n');
      await adapter.writeFile(sessionId, 'real-directory/new.txt', 'new\n');
      expect(await adapter.readFile(sessionId, 'real-directory/new.txt')).toBe(
        'new\n',
      );

      await expect(
        adapter.readFile(sessionId, '../outside.txt'),
      ).rejects.toThrow('Invalid workspace-relative file path');
      await expect(
        adapter.readFile(sessionId, '/tmp/outside.txt'),
      ).rejects.toThrow('Invalid workspace-relative file path');

      await adapter.exec(
        sessionId,
        'create-workspace-links',
        'printf "outside\\n" > /tmp/outside.txt && ln -s inside.txt internal-link && ln -s /tmp/outside.txt external-link && ln -s /tmp external-directory && ln -s chain-b chain-a && ln -s /tmp/outside.txt chain-b',
      );

      const files = await adapter.listFiles(sessionId);
      expect(files.map((file) => file.path)).toEqual(
        expect.arrayContaining(['inside.txt', 'real-directory/new.txt']),
      );

      expect(await adapter.readFile(sessionId, 'internal-link')).toBe(
        'updated\n',
      );
      await expect(
        adapter.writeFile(sessionId, 'internal-link', 'changed\n'),
      ).rejects.toThrow('resolves outside /workspace or is not a regular file');
      expect(await adapter.readFile(sessionId, 'inside.txt')).toBe('updated\n');

      await expect(
        adapter.readFile(sessionId, 'external-link'),
      ).rejects.toThrow('resolves outside /workspace or is not a regular file');
      await expect(
        adapter.writeFile(sessionId, 'external-link', 'changed\n'),
      ).rejects.toThrow('resolves outside /workspace or is not a regular file');
      await expect(
        adapter.writeFile(sessionId, 'external-directory/new.txt', 'changed\n'),
      ).rejects.toThrow('resolves outside /workspace or is not a regular file');
      await expect(adapter.readFile(sessionId, 'chain-a')).rejects.toThrow(
        'resolves outside /workspace or is not a regular file',
      );
      await expect(
        adapter.writeFile(sessionId, 'real-directory', 'changed\n'),
      ).rejects.toThrow('resolves outside /workspace or is not a regular file');

      const outside = await adapter.exec(
        sessionId,
        'verify-outside-file',
        'cat /tmp/outside.txt; test ! -e /tmp/new.txt',
      );
      expect(outside.exitCode).toBe(0);
      expect(outside.stdoutPreview).toBe('outside\n');
    } finally {
      await adapter.teardown(sessionId);
    }
  }, 45_000);
});
