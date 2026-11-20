# InvoiceLite: Jest companion code

InvoiceLite is a small invoicing library you test, lesson by lesson, in the course
**Jest: Unit Testing in JavaScript and TypeScript**. It starts as one `Money` class with three tests
and grows into a tested service: discounts, tax, invoice numbers, an Express API, a payment client,
React screens and a PostgreSQL repository.

This repository holds a runnable copy of the project at the end of every lesson that changes code,
plus the finished project.

```text
steps/<NN>-<lesson-slug>/   the project at the end of lesson NN (a complete npm project)
final/                      the finished project (the same files as the last step)
scripts/verify-all.sh       installs and tests every project (verify-all.ps1 for PowerShell)
```

Every folder runs on its own. If something you typed does not work, compare it with the step folder
of that lesson.

## Set up your computer

You need **Node.js** (with npm), an **editor**, and from lesson 20 on, **Docker**.

### Node.js

Node.js 26 is the Active LTS line in November 2026; Node.js 24 (Maintenance LTS) works as well.
MSW 3 and Stryker 10 need Node.js 22 or newer, and from lesson 15 on Jest loads MSW (an ES module)
through Node's VM modules, which needs Node.js 24.9 or newer.

| System | Command |
| --- | --- |
| Windows (PowerShell) | `winget install OpenJS.NodeJS.LTS` |
| macOS (Homebrew) | `brew install node` (the `node` formula is 26.x in November 2026; there is no `node@26`) |
| Linux | use the NodeSource packages or a version manager such as nvm (`nvm install 26`) |

Open a new terminal and check:

```bash
node --version
npm --version
```

### Docker

The integration tests (lesson 20 on) start a throwaway PostgreSQL with Testcontainers. Install
Docker Desktop (Windows, macOS) or Docker Engine (Linux) and start it. Check with `docker version`.
Every other test runs without Docker.

### An editor

Visual Studio Code works well: it understands TypeScript out of the box. Open a project folder
(for example `final`), not the repository root.

## Run any step or final

From the folder of the project you want, for example `final`:

```bash
npm ci                     # install exactly the versions in package-lock.json
npm test                   # run the unit tests
npm run typecheck          # check the types (from lesson 06)
npm run test:coverage      # tests plus a coverage report (from lesson 13)
npm run mutate             # mutation testing with Stryker (from lesson 19)
npm run test:integration   # PostgreSQL integration tests, Docker running (from lesson 20)
```

Steps 03 to 05 are plain JavaScript and have only `npm test`. Run `npm run` in any folder to see
the scripts it has.

## Course map

| Folder | Lesson | What changes |
| --- | --- | --- |
| `steps/03-your-first-jest-test` | Your First Jest Test | `Money` and three tests |
| `steps/04-matchers-in-depth` | Matchers in Depth | `LineItem`, `InvoiceCalculator`, the common matchers |
| `steps/05-organizing-tests-describe-each-and-hooks` | Organizing Tests: describe, each and Hooks | discount policies, `TaxCalculator`, `describe`, `test.each`, hooks |
| `steps/06-jest-with-typescript-configuration-and-transforms` | Jest with TypeScript: Configuration and Transforms | everything in TypeScript, `@swc/jest`, `tsc` |
| `steps/07-testing-asynchronous-code` | Testing Asynchronous Code | `Invoice`, an async repository, test data builders |
| `steps/08-writing-testable-code-and-tdd` | Writing Testable Code and TDD | `Clock`, `InvoiceNumberGenerator` built test first |
| `steps/09-mock-functions` | Mock Functions | `InvoiceService` with mocked payments and notifications |
| `steps/10-spies-and-module-mocks` | Spies and Module Mocks | `EmailNotifier`, `jest.spyOn`, `jest.mock` |
| `steps/11-fake-timers-and-dates` | Fake Timers and Dates | `retry`, `OverdueSweeper`, fake time |
| `steps/12-snapshot-testing-and-when-to-avoid-it` | Snapshot Testing and When to Avoid It | the text and JSON views of an invoice |
| `steps/13-code-coverage` | Code Coverage | coverage settings and thresholds |
| `steps/14-testing-an-http-api-with-supertest` | Testing an HTTP API with supertest | the Express API |
| `steps/15-mocking-the-network-with-msw` | Mocking the Network with MSW | `PaymentGatewayClient`, MSW |
| `steps/16-testing-react-components-with-testing-library` | Testing React Components with Testing Library | `InvoiceSummary`, `LineItemForm` |
| `steps/17-custom-matchers-and-setup-files` | Custom Matchers and Setup Files | `toBeMoney`, setup files |
| `steps/18-property-based-testing-with-fast-check` | Property-Based Testing with fast-check | properties, and the bugs they found |
| `steps/19-mutation-testing-with-stryker` | Mutation Testing with Stryker | Stryker, and the tests it asked for |
| `steps/20-integration-tests-with-testcontainers` | Integration Tests with Testcontainers | `PgInvoiceRepository`, a repository contract |
| `steps/21-projects-sharding-and-fast-feedback` | Projects, Sharding and Fast Feedback | Jest `projects` for unit and UI tests, shared settings, sharding |
| `steps/22-tests-in-ci-flaky-tests-and-test-smells` | Tests in CI, Flaky Tests and Test Smells | a CI workflow and CI scripts |
| `steps/23-capstone-a-feature-built-test-first` | Capstone: A Feature Built Test First | partial payments, test first at every level |

## Check everything

`scripts/verify-all.sh` (macOS, Linux, Git Bash) and `scripts/verify-all.ps1` (Windows PowerShell)
install, type-check and test every step folder and `final`. Add `--clean` / `-Clean` to delete each
project's `node_modules/`, `coverage/` and `reports/` afterwards. Docker must be running for the
projects with integration tests.

## License

Copyright (C) 2026 SypherNext

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). You may
use, study and change it. If you share a modified version, or run one as a website or service
that other people use, you must make your full modified source code available under the same
license. See [LICENSE](LICENSE) for the full terms.
