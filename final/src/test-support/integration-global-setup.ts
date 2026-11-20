import globalSetup from './global-setup';
import { startPostgres } from './postgres';

// Runs once before the integration tests: one database for the whole run.
// The test workers start afterwards and read DATABASE_URL from the environment.
export default async function integrationGlobalSetup(): Promise<void> {
  globalSetup();
  const container = await startPostgres();
  process.env.DATABASE_URL = container.getConnectionUri();
  globalThis.postgresContainer = container;
}
