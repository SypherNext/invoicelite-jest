// Runs a task on a fixed interval, for example markOverdue() once an hour.
// A run that is still busy when the next tick comes is not started twice.
export class OverdueSweeper {
  private readonly task: () => Promise<unknown>;
  private timer: ReturnType<typeof setInterval> | undefined;
  private running = false;

  constructor(task: () => Promise<unknown>) {
    this.task = task;
  }

  start(intervalMs: number): void {
    this.stop();
    this.timer = setInterval(() => void this.tick(), intervalMs);
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.task();
    } finally {
      this.running = false;
    }
  }
}
