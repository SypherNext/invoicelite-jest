// Mutation testing with Stryker: `npm run mutate`.
// Stryker makes small changes (mutants) to the files in `mutate`, runs the Jest tests
// against each one, and reports every mutant that no test noticed.

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'jest',
  jest: {
    configFile: 'jest.config.js',
    // The UI tests pick jsdom with a comment at the top of the file, and Stryker cannot
    // measure per-test coverage inside that environment. They do not cover the
    // mutated files anyway, so leave them out of mutation runs.
    config: { testPathIgnorePatterns: ['/node_modules/', '/src/ui/'] },
  },
  // The same Node flags as `npm test` (MSW is an ES module, see lesson 15).
  testRunnerNodeArgs: ['--experimental-vm-modules', '--disable-warning=ExperimentalWarning'],
  // The pricing rules: small, pure and important. Mutating everything takes far longer.
  mutate: [
    'src/money.ts',
    'src/discounts.ts',
    'src/tax-calculator.ts',
    'src/invoice-calculator.ts',
    'src/invoice-number-generator.ts',
  ],
  // Run only the tests that cover a mutant, not the whole suite for every mutant.
  coverageAnalysis: 'perTest',
  // Each Jest run has a fixed start-up cost; a few runners in parallel, with time to
  // spare, beat one per CPU core fighting for the machine.
  concurrency: 4,
  timeoutMS: 10000,
  reporters: ['clear-text', 'html', 'progress'],
  thresholds: { high: 90, low: 80, break: 80 },
  // Stryker 10.1 rewrites tsconfig.json with the JavaScript API of TypeScript 5 and 6,
  // which TypeScript 7 no longer has. This project has nothing for that step to rewrite,
  // so point it at a file that does not exist and Stryker skips it.
  tsconfigFile: 'no-tsconfig-rewrite.json',
};
