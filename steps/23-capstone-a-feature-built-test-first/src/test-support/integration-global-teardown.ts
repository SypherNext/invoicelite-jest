import './postgres';

// Runs once after the integration tests: stop and remove the database container.
export default async function integrationGlobalTeardown(): Promise<void> {
  await globalThis.postgresContainer?.stop();
}
