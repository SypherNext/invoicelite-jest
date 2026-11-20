import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { OverdueSweeper } from './overdue-sweeper';

const HOUR = 60 * 60 * 1000;

describe('OverdueSweeper', () => {
  let task: jest.Mock<() => Promise<void>>;
  let sweeper: OverdueSweeper;

  beforeEach(() => {
    jest.useFakeTimers();
    task = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    sweeper = new OverdueSweeper(task);
  });

  afterEach(() => {
    sweeper.stop();
    jest.useRealTimers();
  });

  test('runs the task once an hour', async () => {
    sweeper.start(HOUR);

    await jest.advanceTimersByTimeAsync(HOUR - 1);
    expect(task).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(2 * HOUR);
    expect(task).toHaveBeenCalledTimes(3);
  });

  test('stops running after stop()', async () => {
    sweeper.start(HOUR);
    await jest.advanceTimersByTimeAsync(HOUR);

    sweeper.stop();
    await jest.advanceTimersByTimeAsync(5 * HOUR);

    expect(task).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('skips a tick while the previous run is still busy', async () => {
    let finish: () => void = () => {};
    task.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));
    sweeper.start(HOUR);

    await jest.advanceTimersByTimeAsync(3 * HOUR);
    expect(task).toHaveBeenCalledTimes(1);

    finish();
    await jest.advanceTimersByTimeAsync(HOUR);
    expect(task).toHaveBeenCalledTimes(2);
  });
});
