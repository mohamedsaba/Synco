import { describe, expect, it } from 'vitest';

import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';

describe('DockerSandboxAdapter integration', () => {
  const sessionId = `test-${Date.now()}`;
  const adapter = new DockerSandboxAdapter();

  it('creates a hardened container, executes multiple commands with shared state, handles timeout and teardown', async () => {
    try {
      // 1. Create and verify readiness
      await adapter.createAndVerify(sessionId, {
        'src/greeting.txt': 'Hello Hirearchy\n',
      });

      // 2. Execute command reading initial file
      const res1 = await adapter.exec(
        sessionId,
        'cmd-1',
        'cat src/greeting.txt',
      );
      expect(res1.exitCode).toBe(0);
      expect(res1.stdoutPreview).toBe('Hello Hirearchy\n');
      expect(res1.timedOut).toBe(false);

      // 3. Command-side filesystem mutations persist across commands in the same sandbox
      const res2 = await adapter.exec(
        sessionId,
        'cmd-2',
        'echo "modified content" > src/greeting.txt',
      );
      expect(res2.exitCode).toBe(0);

      const res3 = await adapter.exec(
        sessionId,
        'cmd-3',
        'cat src/greeting.txt',
      );
      expect(res3.exitCode).toBe(0);
      expect(res3.stdoutPreview).toBe('modified content\n');

      // 4. Candidate command failure (non-zero exit code) is captured as factual evidence
      const resFail = await adapter.exec(sessionId, 'cmd-fail', 'false');
      expect(resFail.exitCode).toBe(1);
      expect(resFail.timedOut).toBe(false);

      // 5. Timeout terminates process and child processes inside sandbox
      // Command starts background child loop writing to a file and sleep
      const resTimeout = await adapter.exec(
        sessionId,
        'cmd-timeout',
        'sh -c "(while true; do echo leak >> leak.txt; sleep 0.05; done) & sleep 30"',
        '/workspace',
        500, // 500ms timeout
      );

      expect(resTimeout.timedOut).toBe(true);
      expect(resTimeout.exitCode).toBe(null);

      // Verify that after timeout, no background loop continues running in the sandbox
      const read1 = await adapter.exec(
        sessionId,
        'cmd-read-1',
        'wc -l < leak.txt',
      );
      const count1 = parseInt(read1.stdoutPreview.trim(), 10);
      expect(count1).toBeGreaterThan(0);

      await new Promise((r) => setTimeout(r, 200));

      const read2 = await adapter.exec(
        sessionId,
        'cmd-read-2',
        'wc -l < leak.txt',
      );
      const count2 = parseInt(read2.stdoutPreview.trim(), 10);
      // File line count has NOT changed, proving the background loop process was terminated
      expect(count2).toBe(count1);

      const resCheck = await adapter.exec(
        sessionId,
        'cmd-check-procs',
        'ps -o pid,comm',
      );
      expect(resCheck.stdoutPreview).not.toContain('sleep 30');

      // 6. Streaming memory-bounded output truncation
      const resFlood = await adapter.exec(
        sessionId,
        'cmd-flood',
        'head -c 70000 /dev/zero | tr "\\0" "x"',
      );
      expect(resFlood.stdoutTruncated).toBe(true);
      expect(resFlood.stdoutBytes).toBe(70000);
      expect(resFlood.stdoutPreview.length).toBeLessThanOrEqual(64 * 1024);
    } finally {
      const containerName = adapter.getContainerName(sessionId);
      await adapter.teardown(sessionId);

      // Verify container is completely gone from Docker
      const { spawnSync } = await import('node:child_process');
      const inspectRes = spawnSync('docker', ['inspect', containerName]);
      expect(inspectRes.status).not.toBe(0);

      // Repeated teardown is idempotent
      await expect(adapter.teardown(sessionId)).resolves.not.toThrow();
    }
  }, 45_000);
});
