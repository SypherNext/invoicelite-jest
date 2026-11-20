import { afterAll, afterEach, beforeAll } from '@jest/globals';
import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';

// Starts an MSW server for one test file: it answers fetch calls with the given
// handlers, fails the test on any request no handler matches, and forgets the
// handlers a test added with server.use() once that test ends.
export function setupMockNetwork(...handlers: RequestHandler[]) {
  const server = setupServer(...handlers);
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  return server;
}
