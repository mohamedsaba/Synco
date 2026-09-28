import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';
import { DockerSandboxAdapter } from '../../apps/web/src/sandbox/docker-sandbox-adapter';
import { SessionService } from '../../apps/web/src/sessions/session-service';
import { SqliteSessionStore } from '../../apps/web/src/sessions/sqlite-session-store';

const imageName = 'hirearchy-scenario-001:latest';

const expectRecordedPidsGone = async (
  adapter: DockerSandboxAdapter,
  sessionId: string,
  file: string,
) => {
  const result = await adapter.exec(
    sessionId,
    `check-${path.basename(file)}`,
    `for pid in $(cat "${file}"); do kill -0 "$pid" 2>/dev/null && echo "alive:$pid"; done`,
  );
  expect(result.stdoutPreview).toBe('');
};

describe('T1A.3B command supervisor containment', () => {
  const sessionId = `supervisor-${Date.now()}`;
  const adapter = new DockerSandboxAdapter({
    imageName,
    defaultTimeoutMs: 10_000,
  });

  beforeAll(async () => {
    await adapter.createAndVerify(sessionId, { scenarioType: 'multi_file' });
  }, 60_000);

  afterAll(async () => {
    await adapter.teardown(sessionId).catch(() => {});
  }, 30_000);

  it('uses only the root control-plane drop capabilities', async () => {
    const inspected = await adapter.runProcess(
      'docker',
      [
        'inspect',
        '-f',
        '{{json .HostConfig.CapAdd}}|{{json .HostConfig.SecurityOpt}}',
        adapter.getContainerName(sessionId),
      ],
      { timeoutMs: 10_000 },
    );
    const [capabilities, securityOptions] = inspected.stdout.trim().split('|');

    expect(JSON.parse(capabilities).sort()).toEqual([
      'CAP_SETGID',
      'CAP_SETUID',
    ]);
    expect(JSON.parse(securityOptions)).toContain('no-new-privileges:true');
  });

  it('preserves normal result, shell, and bounded-output semantics', async () => {
    const result = await adapter.exec(
      sessionId,
      'normal-result',
      'value="normal"; printf "stdout:%s" "$value"; printf "stderr" >&2; exit 7',
    );

    expect(result).toMatchObject({
      exitCode: 7,
      timedOut: false,
      stdoutPreview: 'stdout:normal',
      stderrPreview: 'stderr',
      stdoutBytes: 13,
      stderrBytes: 6,
      stdoutTruncated: false,
      stderrTruncated: false,
    });

    const flood = await adapter.exec(
      sessionId,
      'bounded-output',
      'head -c 70000 /dev/zero | tr "\\0" x',
    );
    expect(flood.stdoutBytes).toBe(70_000);
    expect(flood.stdoutTruncated).toBe(true);
    expect(flood.stdoutPreview).toHaveLength(64 * 1024);
  });

  it('drops supervisor and candidate identities and capabilities permanently', async () => {
    const result = await adapter.exec(
      sessionId,
      'candidate-identity',
      [
        `awk '/^(Uid|Gid|CapEff|CapPrm):/{print "candidate-" $0}' /proc/self/status`,
        `awk '/^(Uid|Gid|CapEff|CapPrm):/{print "supervisor-" $0}' /proc/$PPID/status`,
        `if python3 -c 'import os; os.setuid(0)' 2>/dev/null; then exit 1; else printf setuid-blocked; fi`,
      ].join('; '),
    );

    for (const process of ['candidate', 'supervisor']) {
      expect(result.stdoutPreview).toMatch(
        new RegExp(`${process}-Uid:\\s+1000\\s+1000\\s+1000\\s+1000`),
      );
      expect(result.stdoutPreview).toMatch(
        new RegExp(`${process}-Gid:\\s+1000\\s+1000\\s+1000\\s+1000`),
      );
      expect(result.stdoutPreview).toMatch(
        new RegExp(`${process}-CapEff:\\s+0000000000000000`),
      );
      expect(result.stdoutPreview).toMatch(
        new RegExp(`${process}-CapPrm:\\s+0000000000000000`),
      );
    }
    expect(result.stdoutPreview).toContain('setuid-blocked');
  });

  it('does not expose a privileged supervisor interface to candidate code', async () => {
    const result = await adapter.exec(
      sessionId,
      'candidate-supervisor-access',
      'test ! -r /run/hirearchy-evidence; /usr/local/bin/hirearchy-exec-supervisor 10 /workspace nested true; printf "%s" "$?"',
    );

    expect(result).toMatchObject({
      exitCode: 0,
      timedOut: false,
      stdoutPreview: '125',
    });
    expect(result.stderrPreview).toContain(
      'command supervisor rejected invalid invocation',
    );
  });

  it('reports setup failure as platform failure without executing candidate code', async () => {
    await expect(
      adapter.exec(
        sessionId,
        'setup-failure',
        'touch /workspace/setup-must-not-run',
        '/missing-working-directory',
        500,
      ),
    ).rejects.toMatchObject({ code: 'SANDBOX_EXECUTION_FAILED' });

    const check = await adapter.exec(
      sessionId,
      'check-setup-failure',
      'test ! -e /workspace/setup-must-not-run',
    );
    expect(check.exitCode).toBe(0);
  });

  it('terminates and reaps a normal child before returning timedOut', async () => {
    const pidFile = '/workspace/normal-child.pids';
    const result = await adapter.exec(
      sessionId,
      'normal-child-timeout',
      `sh -c 'echo $$ > ${pidFile}; sleep 30'`,
      '/workspace',
      500,
    );

    expect(result).toMatchObject({ exitCode: null, timedOut: true });
    await expectRecordedPidsGone(adapter, sessionId, pidFile);
  });

  it.each([
    [
      'background shell job',
      '/workspace/background.pids',
      "(sh -c 'echo $$ > /workspace/background.pids; sleep 30') & wait",
    ],
    [
      'nohup descendant',
      '/workspace/nohup.pids',
      "nohup sh -c 'echo $$ > /workspace/nohup.pids; sleep 30' >/tmp/nohup.out 2>&1 & wait",
    ],
    [
      'setsid descendant',
      '/workspace/setsid.pids',
      `python3 -c 'import os,time; os.setsid(); open("/workspace/setsid.pids","w").write(str(os.getpid())); time.sleep(30)' & wait`,
    ],
    [
      'double-fork descendant',
      '/workspace/double-fork.pids',
      `python3 -c 'import os,time
if os.fork(): time.sleep(30)
os.setsid()
if os.fork(): os._exit(0)
open("/workspace/double-fork.pids","w").write(str(os.getpid()))
time.sleep(30)'`,
    ],
    [
      'SIGTERM-resistant descendant',
      '/workspace/term-resistant.pids',
      `(trap '' TERM; echo $$ > /workspace/term-resistant.pids; while :; do sleep 1; done) & wait`,
    ],
  ])('contains %s', async (_name, pidFile, command) => {
    const result = await adapter.exec(
      sessionId,
      `detached-${path.basename(pidFile)}`,
      command,
      '/workspace',
      700,
    );

    expect(result).toMatchObject({ exitCode: null, timedOut: true });
    await expectRecordedPidsGone(adapter, sessionId, pidFile);
  });

  it('remains the subreaper after dropping privileges', async () => {
    const result = await adapter.exec(
      sessionId,
      'unprivileged-subreaper',
      `supervisor=$PPID python3 -c 'import os,time
supervisor=int(os.environ["supervisor"])
if os.fork(): time.sleep(30)
os.setsid()
if os.fork(): os._exit(0)
time.sleep(.1)
open("/workspace/subreaper.pids","w").write(f"{os.getpid()} {os.getppid()} {supervisor}")
time.sleep(30)'`,
      '/workspace',
      700,
    );

    expect(result).toMatchObject({ exitCode: null, timedOut: true });
    const proof = await adapter.exec(
      sessionId,
      'subreaper-proof',
      'set -- $(cat /workspace/subreaper.pids); test "$2" = "$3"; printf "%s" "$2"',
    );
    expect(proof.exitCode).toBe(0);
    expect(proof.stdoutPreview).toMatch(/^\d+$/);
    await expectRecordedPidsGone(
      adapter,
      sessionId,
      '/workspace/subreaper.pids',
    );
  });

  it('preserves a process that existed before the supervised command', async () => {
    const containerName = adapter.getContainerName(sessionId);
    await adapter.runProcess(
      'docker',
      [
        'exec',
        '-d',
        containerName,
        'sh',
        '-c',
        'echo $$ > /tmp/preexisting.pid; exec sleep 300',
      ],
      { timeoutMs: 10_000 },
    );
    await adapter.runProcess(
      'docker',
      [
        'exec',
        containerName,
        'sh',
        '-c',
        'for i in $(seq 1 50); do test -s /tmp/preexisting.pid && exit 0; sleep .02; done; exit 1',
      ],
      { timeoutMs: 10_000 },
    );

    try {
      const timeout = await adapter.exec(
        sessionId,
        'scoped-timeout',
        'sleep 30',
        '/workspace',
        400,
      );
      expect(timeout.timedOut).toBe(true);

      const alive = await adapter.runProcess(
        'docker',
        [
          'exec',
          containerName,
          'sh',
          '-c',
          'kill -0 "$(cat /tmp/preexisting.pid)" && echo alive',
        ],
        { timeoutMs: 10_000 },
      );
      expect(alive.stdout.trim()).toBe('alive');
    } finally {
      await adapter
        .runProcess(
          'docker',
          [
            'exec',
            containerName,
            'sh',
            '-c',
            'kill "$(cat /tmp/preexisting.pid)" 2>/dev/null || true',
          ],
          { timeoutMs: 10_000 },
        )
        .catch(() => {});
    }
  });

  it('keeps PostgreSQL, Redis, and the application healthy after timeout', async () => {
    const timeout = await adapter.exec(
      sessionId,
      'service-preservation-timeout',
      'sleep 30',
      '/workspace',
      400,
    );
    expect(timeout.timedOut).toBe(true);

    const health = await adapter.exec(
      sessionId,
      'service-health',
      [
        'pg_isready -h 127.0.0.1 -p 5432 -U hirearchy -q',
        `test "$(redis-cli ping)" = PONG`,
        `python3 -c 'import json,urllib.request; assert json.load(urllib.request.urlopen("http://127.0.0.1:8000/health"))["status"] == "healthy"'`,
        'echo healthy',
      ].join(' && '),
    );
    expect(health).toMatchObject({ exitCode: 0, timedOut: false });
    expect(health.stdoutPreview.trim()).toBe('healthy');
  });

  it('handles bounded fork, exit, and reparent races without survivors', async () => {
    const pidFile = '/workspace/race.pids';
    const result = await adapter.exec(
      sessionId,
      'race-timeout',
      `python3 -c 'import os,time
time.sleep(.45)
first=os.fork()
if first == 0:
 os.setsid()
 second=os.fork()
 if second: os._exit(0)
 open("${pidFile}","w").write(str(os.getpid()))
 time.sleep(30)
time.sleep(30)'`,
      '/workspace',
      600,
    );

    expect(result).toMatchObject({ exitCode: null, timedOut: true });
    await expectRecordedPidsGone(adapter, sessionId, pidFile);
  });

  it('allows a subsequent command after a contained timeout', async () => {
    const timeout = await adapter.exec(
      sessionId,
      'prior-timeout',
      'sleep 30',
      '/workspace',
      300,
    );
    expect(timeout.timedOut).toBe(true);

    const next = await adapter.exec(
      sessionId,
      'subsequent-command',
      'printf subsequent-ok',
    );
    expect(next).toMatchObject({
      exitCode: 0,
      timedOut: false,
      stdoutPreview: 'subsequent-ok',
    });
  });
});

describe('T1A.3B command timeout evidence and session state', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'hirearchy-supervisor-'));
  const databasePath = path.join(directory, 'test.sqlite');
  const adapter = new DockerSandboxAdapter({
    imageName,
    defaultTimeoutMs: 400,
  });
  const eventStore = new SqliteEventStore(databasePath);
  const sessionStore = new SqliteSessionStore(databasePath);
  const service = new SessionService(sessionStore, {
    eventStore,
    sandboxAdapter: adapter,
    commandTimeoutMs: 400,
  });
  let candidateToken: string;
  let sessionId: string;

  beforeAll(async () => {
    const created = service.createSession({ scenarioId: 'scenario-001' });
    candidateToken = created.candidateToken;
    sessionId = created.session.id;
    await service.activate(candidateToken);
  }, 60_000);

  afterAll(async () => {
    await adapter.teardown(sessionId).catch(() => {});
    rmSync(directory, { recursive: true, force: true });
  }, 30_000);

  it('records factual timeout evidence and leaves the session ACTIVE', async () => {
    const result = await service.executeCommand(candidateToken, 'sleep 30');
    expect(result).toMatchObject({ exitCode: null, timedOut: true });
    expect(service.getCandidateSession(candidateToken).status).toBe('ACTIVE');

    const events = eventStore.getEvents(sessionId);
    expect(events.map((event) => event.type)).toContain('COMMAND_STARTED');
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'COMMAND_FINISHED',
        payload: expect.objectContaining({
          exitCode: null,
          timedOut: true,
        }),
      }),
    );
  });
});
