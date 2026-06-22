// [DETERMINISTIC] Coverage thresholds are a fixed numeric gate: a given test run
// produces the same coverage numbers, so the pass/fail is repeatable across runs
// and machines. Set just under measured baselines — a ratchet that can rise, not fall.
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.js$'],
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/**/*.js', '!src/**/__tests__/**', '!src/seed/**'],
  coverageThreshold: {
    global: { lines: 85, statements: 85, functions: 95, branches: 70 },
  },
};
