import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { retry } from './retry';

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns the first success without waiting', async () => {
    const call = jest.fn<() => Promise<string>>().mockResolvedValue('ok');

    await expect(retry(call, { attempts: 3, delayMs: 100 })).resolves.toBe('ok');
    expect(call).toHaveBeenCalledTimes(1);
  });

  test('waits 100 ms, then 200 ms, between attempts', async () => {
    const call = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('busy'))
      .mockRejectedValueOnce(new Error('busy'))
      .mockResolvedValue('ok');

    const result = retry(call, { attempts: 3, delayMs: 100 });

    await jest.advanceTimersByTimeAsync(99);
    expect(call).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(call).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(200);
    expect(call).toHaveBeenCalledTimes(3);
    await expect(result).resolves.toBe('ok');
  });

  test('gives up after the last attempt with the last error', async () => {
    const call = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('still busy'));

    const result = retry(call, { attempts: 3, delayMs: 100 });
    const settled = expect(result).rejects.toThrow('still busy');
    await jest.runAllTimersAsync();

    await settled;
    expect(call).toHaveBeenCalledTimes(3);
  });

  test('stops at once when shouldRetry says no', async () => {
    const call = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('card declined'));

    await expect(
      retry(call, { attempts: 3, delayMs: 100, shouldRetry: () => false }),
    ).rejects.toThrow('card declined');
    expect(call).toHaveBeenCalledTimes(1);
  });
});
