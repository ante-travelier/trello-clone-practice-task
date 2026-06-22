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
