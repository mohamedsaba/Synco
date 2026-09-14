import { createHash, randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  createSubmittedDiff,
  normalizeLineEndings,
} from '../evidence/unified-diff';
import type { WorkspaceChangedPayload } from '../events/session-event';
import { SqliteEventStore } from '../events/sqlite-event-store';
import { DockerSandboxAdapter } from '../sandbox/docker-sandbox-adapter';
import {
  type CommandExecResult,
  type SandboxAdapter,
  SandboxError,
} from '../sandbox/sandbox';
import { scenario001 } from '../scenarios/scenario-001';
import { sliceOneScenario } from '../scenarios/slice-one-scenario';
import {
  type AssessmentSession,
  requireSubmittedSession,
  SessionError,
} from './session';
import { SqliteSessionStore } from './sqlite-session-store';

const maximumContentLength = 100_000;

const hashCandidateToken = (candidateToken: string) =>
  createHash('sha256').update(candidateToken).digest('hex');

export type SessionServiceOptions = Readonly<{
  now?: () => string;
  createId?: () => string;
  createToken?: () => string;
  eventStore?: SqliteEventStore;
  sandboxAdapter?: SandboxAdapter;
}>;

export class SessionService {
  private readonly now: () => string;
  private readonly createId: () => string;
  private readonly createToken: () => string;
  private readonly eventStore?: SqliteEventStore;
  private readonly sandboxAdapter?: SandboxAdapter;
  private readonly sessionQueues = new Map<string, Promise<void>>();

  private async withSessionLock<T>(
    sessionId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const prev = this.sessionQueues.get(sessionId) ?? Promise.resolve();
    let release: () => void;
    const next = new Promise<void>((res) => {
      release = res;
    });
    this.sessionQueues.set(sessionId, next);

    await prev;
    try {
      return await fn();
    } finally {
      release!();
      if (this.sessionQueues.get(sessionId) === next) {
        this.sessionQueues.delete(sessionId);
      }
    }
  }

  private async detectAndRecordDrift(
    sessionId: string,
    source: 'server' = 'server',
  ): Promise<{ currentTree: string; driftDetected: boolean }> {
    if (!this.sandboxAdapter) {
      return { currentTree: '', driftDetected: false };
    }

    const currentTree =
      await this.sandboxAdapter.captureWorkspaceTree(sessionId);

    let lastKnownTree: string;
    if (this.eventStore) {
      const events = this.eventStore.getEvents(sessionId);
      const workspaceEvents = events.filter(
        (e) => e.type === 'WORKSPACE_CHANGED',
      );
      if (workspaceEvents.length > 0) {
        lastKnownTree = (
          workspaceEvents[workspaceEvents.length - 1]
            .payload as WorkspaceChangedPayload
        ).afterTree;
      } else {
        lastKnownTree = await this.sandboxAdapter.getBaselineTree(sessionId);
      }
    } else {
      lastKnownTree = await this.sandboxAdapter.getBaselineTree(sessionId);
    }

    if (currentTree !== lastKnownTree) {
      const diffResult = await this.sandboxAdapter.captureTreeDiff(
        sessionId,
        lastKnownTree,
        currentTree,
      );

      if (this.eventStore) {
        this.eventStore.append({
          id: `evt_${this.createId()}`,
          sessionId,
          type: 'WORKSPACE_CHANGED',
          timestamp: this.now(),
          source,
          payload: {
            changeId: `chg_${this.createId()}`,
            origin: 'out_of_band',
            beforeTree: lastKnownTree,
            afterTree: currentTree,
            files: diffResult.files,
            totalAdditions: diffResult.totalAdditions,
            totalDeletions: diffResult.totalDeletions,
          },
        });
      }
      return { currentTree, driftDetected: true };
    }

    return { currentTree, driftDetected: false };
  }

  constructor(
    private readonly store: SqliteSessionStore,
    options: SessionServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? randomUUID;
    this.createToken =
      options.createToken ?? (() => randomBytes(32).toString('base64url'));
    this.eventStore = options.eventStore;
    this.sandboxAdapter = options.sandboxAdapter;
  }

  createSession(options?: { scenarioId?: string }) {
    const candidateToken = this.createToken();
    const scenario =
      options?.scenarioId === scenario001.id ||
      options?.scenarioId === 'scenario-001'
        ? scenario001
        : sliceOneScenario;
    const originalContent = normalizeLineEndings(scenario.originalContent);
    const session: AssessmentSession = {
      id: this.createId(),
      candidateTokenHash: hashCandidateToken(candidateToken),
      scenario: { ...scenario, originalContent },
      status: 'CREATED',
      workingContent: originalContent,
      submittedContent: null,
      createdAt: this.now(),
      activatedAt: null,
      submittedAt: null,
      scenarioType: scenario.type ?? 'single_file',
      submittedDiff: null,
    };

    this.store.create(session);
    return { candidateToken, session };
  }

  getCandidateSession(candidateToken: string) {
    const session = this.store.findByCandidateTokenHash(
      hashCandidateToken(candidateToken),
    );

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    return session;
  }

  async activate(candidateToken: string) {
    const tokenHash = hashCandidateToken(candidateToken);
    const session = this.store.findByCandidateTokenHash(tokenHash);

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    if (session.status === 'ACTIVE') {
      return session;
    }

    if (session.status !== 'CREATED') {
      throw new SessionError(
        'SESSION_NOT_ACTIVE',
        'A submitted session cannot be activated.',
      );
    }

    // Readiness gate: Sandbox must be created and verified before session transitions to ACTIVE
    if (this.sandboxAdapter) {
      if (
        session.scenarioType === 'multi_file' ||
        session.scenario.type === 'multi_file'
      ) {
        await this.sandboxAdapter.createAndVerify(session.id, {
          imageName:
            session.scenario.imageName ?? 'delimit-scenario-001:latest',
          scenarioType: 'multi_file',
        });
      } else {
        await this.sandboxAdapter.createAndVerify(session.id, {
          [session.scenario.filePath]: session.workingContent,
        });
      }
    }

    // Only after readiness succeeds, transition to ACTIVE and record activatedAt
    return this.store.activate(tokenHash, this.now());
  }

  async save(candidateToken: string, content: string) {
    if (content.length > maximumContentLength) {
      throw new SessionError(
        'CONTENT_TOO_LARGE',
        'The file exceeds the 100 KB limit for this scenario.',
      );
    }

    const tokenHash = hashCandidateToken(candidateToken);
    const normalized = normalizeLineEndings(content);
    const session = this.store.save(tokenHash, normalized);

    if (this.sandboxAdapter && session.status === 'ACTIVE') {
      await this.sandboxAdapter
        .writeFile(session.id, session.scenario.filePath, normalized)
        .catch((err) => {
          console.warn('Could not sync working content to active sandbox', err);
        });
    }

    return session;
  }

  async executeCommand(
    candidateToken: string,
    command: string,
  ): Promise<CommandExecResult> {
    const tokenHash = hashCandidateToken(candidateToken);
    const session = this.store.findByCandidateTokenHash(tokenHash);

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    return this.withSessionLock(session.id, async () => {
      const current = this.store.findByCandidateTokenHash(tokenHash);
      if (!current) {
        throw new SessionError(
          'SESSION_NOT_FOUND',
          'The candidate session was not found.',
        );
      }

      if (current.status !== 'ACTIVE') {
        throw new SessionError(
          'SESSION_NOT_ACTIVE',
          'Commands can be executed only while the session is active.',
        );
      }

      if (!this.sandboxAdapter) {
        throw new SandboxError(
          'SANDBOX_NOT_FOUND',
          'No sandbox runtime is configured for this environment.',
        );
      }

      const isMultiFile =
        current.scenarioType === 'multi_file' ||
        current.scenario.type === 'multi_file';

      let beforeTree: string | null = null;
      if (isMultiFile) {
        try {
          const driftResult = await this.detectAndRecordDrift(current.id);
          beforeTree = driftResult.currentTree;
        } catch (error) {
          throw new SessionError(
            'PLATFORM_CAPTURE_FAILED',
            `Pre-command workspace capture failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const commandId = `cmd_${this.createId()}`;

      // 1. Authoritatively record COMMAND_STARTED
      if (this.eventStore) {
        this.eventStore.append({
          id: `evt_${this.createId()}`,
          sessionId: current.id,
          type: 'COMMAND_STARTED',
          timestamp: this.now(),
          source: 'server',
          payload: {
            commandId,
            command,
            cwd: '/workspace',
          },
        });
      }

      // 2. Execute command in sandbox
      const result = await this.sandboxAdapter.exec(
        current.id,
        commandId,
        command,
        '/workspace',
      );

      // 3. Authoritatively record COMMAND_FINISHED
      if (this.eventStore) {
        this.eventStore.append({
          id: `evt_${this.createId()}`,
          sessionId: current.id,
          type: 'COMMAND_FINISHED',
          timestamp: this.now(),
          source: 'server',
          payload: {
            commandId,
            exitCode: result.exitCode,
            timedOut: result.timedOut,
            durationMs: result.durationMs,
            stdoutPreview: result.stdoutPreview,
            stdoutBytes: result.stdoutBytes,
            stdoutTruncated: result.stdoutTruncated,
            stderrPreview: result.stderrPreview,
            stderrBytes: result.stderrBytes,
            stderrTruncated: result.stderrTruncated,
          },
        });
      }

      // 4. Post-command tree capture
      if (isMultiFile && beforeTree !== null) {
        try {
          const afterTree = await this.sandboxAdapter.captureWorkspaceTree(
            current.id,
          );

          if (beforeTree !== afterTree) {
            const diffResult = await this.sandboxAdapter.captureTreeDiff(
              current.id,
              beforeTree,
              afterTree,
            );

            if (this.eventStore) {
              this.eventStore.append({
                id: `evt_${this.createId()}`,
                sessionId: current.id,
                type: 'WORKSPACE_CHANGED',
                timestamp: this.now(),
                source: 'server',
                payload: {
                  changeId: `chg_${this.createId()}`,
                  origin: 'command_execution',
                  commandId,
                  beforeTree,
                  afterTree,
                  files: diffResult.files,
                  totalAdditions: diffResult.totalAdditions,
                  totalDeletions: diffResult.totalDeletions,
                },
              });
            }
          }
        } catch (error) {
          if (this.eventStore) {
            this.eventStore.append({
              id: `evt_${this.createId()}`,
              sessionId: current.id,
              type: 'WORKSPACE_CAPTURE_FAILED',
              timestamp: this.now(),
              source: 'server',
              payload: {
                commandId,
                phase: 'post_command',
                beforeTree,
                errorMessage:
                  error instanceof Error ? error.message : String(error),
              },
            });
          }
        }
      }

      return result;
    });
  }

  async listWorkspaceFiles(candidateToken: string) {
    const session = this.getCandidateSession(candidateToken);
    if (session.status !== 'ACTIVE') {
      throw new SessionError(
        'SESSION_NOT_ACTIVE',
        'Workspace files are only available for active sessions.',
      );
    }
    if (!this.sandboxAdapter) {
      return [];
    }
    return this.sandboxAdapter.listFiles(session.id);
  }

  async readWorkspaceFile(candidateToken: string, filePath: string) {
    const session = this.getCandidateSession(candidateToken);
    if (session.status !== 'ACTIVE') {
      throw new SessionError(
        'SESSION_NOT_ACTIVE',
        'Workspace files are only available for active sessions.',
      );
    }
    if (!this.sandboxAdapter) {
      return '';
    }
    return this.sandboxAdapter.readFile(session.id, filePath);
  }

  async saveWorkspaceFile(
    candidateToken: string,
    filePath: string,
    content: string,
  ) {
    if (content.length > maximumContentLength) {
      throw new SessionError(
        'CONTENT_TOO_LARGE',
        'The file exceeds the 100 KB limit for this scenario.',
      );
    }
    const tokenHash = hashCandidateToken(candidateToken);
    const session = this.store.findByCandidateTokenHash(tokenHash);

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    return this.withSessionLock(session.id, async () => {
      const current = this.store.findByCandidateTokenHash(tokenHash);
      if (!current) {
        throw new SessionError(
          'SESSION_NOT_FOUND',
          'The candidate session was not found.',
        );
      }

      if (current.status !== 'ACTIVE') {
        throw new SessionError(
          'SESSION_NOT_ACTIVE',
          'Workspace files can only be edited during active sessions.',
        );
      }

      if (!this.sandboxAdapter) {
        return { ok: true, path: filePath };
      }

      const isMultiFile =
        current.scenarioType === 'multi_file' ||
        current.scenario.type === 'multi_file';

      let beforeTree: string | null = null;
      if (isMultiFile) {
        try {
          const driftResult = await this.detectAndRecordDrift(current.id);
          beforeTree = driftResult.currentTree;
        } catch (error) {
          throw new SessionError(
            'PLATFORM_CAPTURE_FAILED',
            `Failed to capture workspace before file save: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const normalized = normalizeLineEndings(content);
      await this.sandboxAdapter.writeFile(current.id, filePath, normalized);

      let afterTree: string | null = null;
      if (isMultiFile) {
        try {
          afterTree = await this.sandboxAdapter.captureWorkspaceTree(
            current.id,
          );
        } catch (error) {
          if (this.eventStore) {
            this.eventStore.append({
              id: `evt_${this.createId()}`,
              sessionId: current.id,
              type: 'WORKSPACE_CAPTURE_FAILED',
              timestamp: this.now(),
              source: 'server',
              payload: {
                phase: 'browser_save',
                beforeTree,
                errorMessage:
                  error instanceof Error ? error.message : String(error),
              },
            });
          }
          throw new SessionError(
            'PLATFORM_CAPTURE_FAILED',
            `Workspace file was written, but post-save capture failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (
        isMultiFile &&
        beforeTree !== null &&
        afterTree !== null &&
        beforeTree !== afterTree
      ) {
        try {
          const diffResult = await this.sandboxAdapter.captureTreeDiff(
            current.id,
            beforeTree,
            afterTree,
          );

          if (this.eventStore) {
            this.eventStore.append({
              id: `evt_${this.createId()}`,
              sessionId: current.id,
              type: 'WORKSPACE_CHANGED',
              timestamp: this.now(),
              source: 'server',
              payload: {
                changeId: `chg_${this.createId()}`,
                origin: 'browser_save',
                beforeTree,
                afterTree,
                files: diffResult.files,
                totalAdditions: diffResult.totalAdditions,
                totalDeletions: diffResult.totalDeletions,
              },
            });
          }
        } catch (error) {
          if (this.eventStore) {
            this.eventStore.append({
              id: `evt_${this.createId()}`,
              sessionId: current.id,
              type: 'WORKSPACE_CAPTURE_FAILED',
              timestamp: this.now(),
              source: 'server',
              payload: {
                phase: 'browser_save',
                beforeTree,
                errorMessage:
                  error instanceof Error ? error.message : String(error),
              },
            });
          }
          throw new SessionError(
            'PLATFORM_CAPTURE_FAILED',
            `Workspace file was saved, but diff capture failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      return { ok: true, path: filePath };
    });
  }

  async submit(candidateToken: string) {
    const tokenHash = hashCandidateToken(candidateToken);
    const session = this.store.findByCandidateTokenHash(tokenHash);

    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The candidate session was not found.',
      );
    }

    return this.withSessionLock(session.id, async () => {
      const current = this.store.findByCandidateTokenHash(tokenHash);
      if (!current) {
        throw new SessionError(
          'SESSION_NOT_FOUND',
          'The candidate session was not found.',
        );
      }

      if (current.status === 'SUBMITTED') {
        return current;
      }

      if (current.status !== 'ACTIVE') {
        throw new SessionError(
          'SESSION_NOT_ACTIVE',
          'The session must be active before it can be submitted.',
        );
      }

      let submittedDiff: string | null = null;
      const isMultiFile =
        current.scenarioType === 'multi_file' ||
        current.scenario.type === 'multi_file';

      if (this.sandboxAdapter && isMultiFile) {
        try {
          const driftResult = await this.detectAndRecordDrift(current.id);
          const submittedTree = driftResult.currentTree;
          const baselineTree = await this.sandboxAdapter.getBaselineTree(
            current.id,
          );
          const diffResult = await this.sandboxAdapter.captureTreeDiff(
            current.id,
            baselineTree,
            submittedTree,
          );
          submittedDiff = diffResult.rawDiff;

          // Tree consistency verification
          if (this.eventStore) {
            const events = this.eventStore.getEvents(current.id);
            const workspaceEvents = events.filter(
              (e) => e.type === 'WORKSPACE_CHANGED',
            );
            const lastWorkspaceEvent =
              workspaceEvents.length > 0
                ? workspaceEvents[workspaceEvents.length - 1]
                : null;
            if (lastWorkspaceEvent) {
              const expectedTree = (
                lastWorkspaceEvent.payload as { afterTree?: string }
              ).afterTree;
              if (expectedTree && submittedTree !== expectedTree) {
                console.warn(
                  `Tree consistency warning: submittedTree (${submittedTree}) does not match lastWorkspaceEvent.afterTree (${expectedTree})`,
                );
              }
            } else if (submittedTree !== baselineTree) {
              console.warn(
                `Tree consistency warning: submittedTree (${submittedTree}) differs from baseline (${baselineTree}) without WORKSPACE_CHANGED events.`,
              );
            }
          }
        } catch (error) {
          // Submission capture failure:
          // Do NOT transition to SUBMITTED.
          // Do NOT destroy sandbox.
          // Append WORKSPACE_CAPTURE_FAILED event.
          if (this.eventStore) {
            this.eventStore.append({
              id: `evt_${this.createId()}`,
              sessionId: current.id,
              type: 'WORKSPACE_CAPTURE_FAILED',
              timestamp: this.now(),
              source: 'server',
              payload: {
                phase: 'submission',
                beforeTree: null,
                errorMessage:
                  error instanceof Error ? error.message : String(error),
              },
            });
          }
          throw new SessionError(
            'PLATFORM_CAPTURE_FAILED',
            `Failed to capture submission evidence: ${error instanceof Error ? error.message : String(error)}. Session remains active.`,
          );
        }
      }

      const submitted = this.store.submit(tokenHash, this.now(), submittedDiff);

      // Deterministic sandbox teardown on submission
      if (this.sandboxAdapter) {
        await this.sandboxAdapter.teardown(current.id).catch((err) => {
          console.warn('Error during sandbox teardown on submission', err);
        });
      }

      return submitted;
    });
  }

  getSubmittedEvidence(sessionId: string) {
    const session = this.store.findById(sessionId);
    if (!session) {
      throw new SessionError(
        'SESSION_NOT_FOUND',
        'The evaluator session was not found.',
      );
    }

    const submitted = requireSubmittedSession(session);
    const events = this.eventStore ? this.eventStore.getEvents(sessionId) : [];

    const isMultiFile =
      submitted.scenarioType === 'multi_file' ||
      submitted.scenario.type === 'multi_file';

    const diff =
      isMultiFile &&
      submitted.submittedDiff !== null &&
      submitted.submittedDiff !== undefined
        ? submitted.submittedDiff
        : createSubmittedDiff(
            submitted.scenario.filePath,
            submitted.scenario.originalContent,
            submitted.submittedContent,
          );

    return {
      sessionId: submitted.id,
      scenario: submitted.scenario,
      scenarioType:
        submitted.scenarioType ?? submitted.scenario.type ?? 'single_file',
      activatedAt: submitted.activatedAt,
      submittedAt: submitted.submittedAt,
      originalContent: submitted.scenario.originalContent,
      submittedContent: submitted.submittedContent,
      diff,
      events,
    };
  }

  getSessionEvents(candidateToken: string) {
    const session = this.getCandidateSession(candidateToken);
    return this.eventStore ? this.eventStore.getEvents(session.id) : [];
  }
}

export const getSessionService = () => {
  const databasePath =
    process.env.DELIMIT_DB_PATH ??
    path.join(process.cwd(), '.data/delimit.sqlite');

  const store = new SqliteSessionStore(databasePath);
  const eventStore = new SqliteEventStore(databasePath);
  const sandboxAdapter = new DockerSandboxAdapter();

  return new SessionService(store, { eventStore, sandboxAdapter });
};
