// Stryker runs one plain Jest config, not projects: give it the unit project,
// together with the options the whole run shares.
const { projects, ...wholeRun } = require('./jest.config');

const { displayName, ...unit } = projects.find((project) => project.displayName === 'unit');

/** @type {import('jest').Config} */
module.exports = { ...wholeRun, ...unit };
