import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export type DatabaseInitializer = (database: Database.Database) => void;

export class SqliteTransactionRunner {
  private readonly initializers: DatabaseInitializer[] = [];

  constructor(private readonly databasePath: string) {}

  registerInitializer(initializer: DatabaseInitializer): void {
    this.initializers.push(initializer);
  }

  run<T>(operation: (database: Database.Database) => T): T {
    if (this.databasePath !== ':memory:') {
      mkdirSync(path.dirname(this.databasePath), { recursive: true });
    }

    const database = new Database(this.databasePath);
    database.pragma('journal_mode = WAL');
    database.pragma('busy_timeout = 5000');

    for (const init of this.initializers) {
      init(database);
    }

    try {
      const transaction = database.transaction(() => operation(database));
      return transaction.immediate();
    } finally {
      database.close();
    }
  }

  /**
   * Run an operation with a provided database instance or create a new transaction if none provided.
   */
  runWith<T>(
    database: Database.Database | undefined,
    operation: (database: Database.Database) => T,
  ): T {
    if (database) {
      return operation(database);
    }
    return this.run(operation);
  }
}
