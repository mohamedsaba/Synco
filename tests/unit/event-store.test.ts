import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SqliteEventStore } from '../../apps/web/src/events/sqlite-event-store';

describe('SqliteEventStore', () => {
  let directory: string;
  let databasePath: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'delimit-event-test-'));
    databasePath = path.join(directory, 'events.sqlite');
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('assigns strictly monotonic sequence numbers starting from 1', () => {
    const store = new SqliteEventStore(databasePath);

    const event1 = store.append({
      id: 'evt-1',
      sessionId: 'session-A',
      type: 'COMMAND_STARTED',
      timestamp: '2026-09-14T12:00:00.000Z',
      source: 'server',
      payload: {
        commandId: 'cmd-1',
        command: 'ls -la',
        cwd: '/workspace',
      },
    });

    const event2 = store.append({
      id: 'evt-2',
      sessionId: 'session-A',
      type: 'COMMAND_FINISHED',
      timestamp: '2026-09-14T12:00:01.000Z',
      source: 'server',
      payload: {
        commandId: 'cmd-1',
        exitCode: 0,
        timedOut: false,
        durationMs: 1000,
        stdoutPreview: 'total 0\n',
        stdoutBytes: 8,
        stdoutTruncated: false,
        stderrPreview: '',
        stderrBytes: 0,
        stderrTruncated: false,
      },
    });

    expect(event1.sequence).toBe(1);
    expect(event2.sequence).toBe(2);

    const retrieved = store.getEvents('session-A');
    expect(retrieved).toHaveLength(2);
    expect(retrieved[0].id).toBe('evt-1');
    expect(retrieved[1].id).toBe('evt-2');
  });

  it('keeps sequence numbers isolated across different sessions', () => {
    const store = new SqliteEventStore(databasePath);

    const a1 = store.append({
      id: 'evt-a1',
      sessionId: 'session-A',
      type: 'COMMAND_STARTED',
      timestamp: '2026-09-14T12:00:00.000Z',
      source: 'server',
      payload: { commandId: 'cmd-1', command: 'pwd', cwd: '/workspace' },
    });

    const b1 = store.append({
      id: 'evt-b1',
      sessionId: 'session-B',
      type: 'COMMAND_STARTED',
      timestamp: '2026-09-14T12:00:00.000Z',
      source: 'server',
      payload: { commandId: 'cmd-2', command: 'id', cwd: '/workspace' },
    });

    expect(a1.sequence).toBe(1);
    expect(b1.sequence).toBe(1);
  });

  it('guarantees unique monotonic sequence numbers under concurrent insertion across multiple store connections', async () => {
    // Instantiate multiple stores representing concurrent workers/connections
    const stores = Array.from(
      { length: 5 },
      () => new SqliteEventStore(databasePath),
    );

    const appendTasks = Array.from({ length: 25 }, (_, i) => {
      const store = stores[i % stores.length];
      return new Promise<void>((resolve, reject) => {
        // Interleave execution across event loop ticks
        setTimeout(
          () => {
            try {
              store.append({
                id: `evt-concurrent-${i}`,
                sessionId: 'session-concurrent',
                type: 'COMMAND_STARTED',
                timestamp: `2026-09-14T12:00:00.${String(i).padStart(3, '0')}Z`,
                source: 'server',
                payload: {
                  commandId: `cmd-${i}`,
                  command: `echo ${i}`,
                  cwd: '/workspace',
                },
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          Math.floor(Math.random() * 20),
        );
      });
    });

    await Promise.all(appendTasks);

    const verifierStore = new SqliteEventStore(databasePath);
    const events = verifierStore.getEvents('session-concurrent');
    expect(events).toHaveLength(25);

    const sequences = events.map((e) => e.sequence);
    const expectedSequences = Array.from({ length: 25 }, (_, i) => i + 1);
    expect(sequences).toEqual(expectedSequences);

    // Verify all sequence numbers are strictly unique
    const uniqueSequences = new Set(sequences);
    expect(uniqueSequences.size).toBe(25);
  });
});
