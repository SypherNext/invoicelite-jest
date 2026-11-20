export interface RetryOptions {
  attempts: number;
  delayMs: number;
  factor?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Calls fn until it succeeds or the attempts run out. Between tries it waits
// delayMs, then delayMs * factor, and so on (100 ms, 200 ms, 400 ms by default).
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { attempts, factor = 2, shouldRetry = () => true } = options;
  let wait = options.delayMs;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts || !shouldRetry(error)) {
        throw error;
      }
      await sleep(wait);
      wait *= factor;
    }
  }
}
