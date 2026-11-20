import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';

// The image the integration tests run against: the same major version as production.
export const POSTGRES_IMAGE = 'postgres:18.7-alpine';

const SCHEMA = readFileSync(path.join(__dirname, '..', '..', 'db', 'schema.sql'), 'utf8');

// Starts a throwaway PostgreSQL in Docker, on a free port, with the schema applied.
export async function startPostgres(): Promise<StartedPostgreSqlContainer> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const client = new Client({ connectionString: container.getConnectionUri() });
  await client.connect();
  await client.query(SCHEMA);
  await client.end();
  return container;
}

// globalSetup and globalTeardown run in the same process, so the container can be
// handed from one to the other on the global object.
declare global {
  var postgresContainer: StartedPostgreSqlContainer | undefined;
}
