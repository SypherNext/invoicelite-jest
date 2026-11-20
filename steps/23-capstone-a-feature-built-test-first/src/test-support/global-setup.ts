// Runs once, in Jest's main process, before any test file. The worker processes
// that run the tests start afterwards and inherit this setting, so Node itself
// uses UTC for local dates, whatever time zone the computer is in.
export default function globalSetup(): void {
  process.env.TZ = 'UTC';
}
