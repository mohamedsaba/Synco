import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * SUPPORTED TOPOLOGY
 *
 * This coordination is valid only while candidate session mutations for one
 * deployment run through one long-lived application process.
 *
 * Not supported yet:
 * - multiple mutation workers;
 * - clustered application processes;
 * - multiple replicas;
 * - serverless processes independently mutating the same session.
 *
 * Distributed coordination across multiple processes/instances is deliberately
 * out of scope for the current modular monolith architecture.
 */

export const GLOBAL_SESSION_COORDINATOR_KEY = Symbol.for(
  'hirearchy.sessionOperationCoordinator',
);

export class SessionOperationCoordinator {
  private readonly sessionQueues = new Map<string, Promise<void>>();
  private readonly asyncLocalStorage = new AsyncLocalStorage<string>();

  async run<T>(sessionId: string, operation: () => Promise<T>): Promise<T> {
    const currentContext = this.asyncLocalStorage.getStore();
    if (currentContext === sessionId) {
      throw new Error(
        `Recursive or reentrant session operation coordination is not permitted for session ${sessionId}.`,
      );
    }

    const previousPromise =
      this.sessionQueues.get(sessionId) ?? Promise.resolve();
    let releaseQueue: () => void;
    const currentPromise = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });

    this.sessionQueues.set(sessionId, currentPromise);

    await previousPromise;
    try {
      return await this.asyncLocalStorage.run(sessionId, operation);
    } finally {
      releaseQueue!();
      if (this.sessionQueues.get(sessionId) === currentPromise) {
        this.sessionQueues.delete(sessionId);
      }
    }
  }
}

export const getSessionOperationCoordinator =
  (): SessionOperationCoordinator => {
    const globalTarget = globalThis as unknown as {
      [GLOBAL_SESSION_COORDINATOR_KEY]?: SessionOperationCoordinator;
    };

    if (!globalTarget[GLOBAL_SESSION_COORDINATOR_KEY]) {
      globalTarget[GLOBAL_SESSION_COORDINATOR_KEY] =
        new SessionOperationCoordinator();
    }

    return globalTarget[GLOBAL_SESSION_COORDINATOR_KEY];
  };
