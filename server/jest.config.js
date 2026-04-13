export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.js$', 'loadEnv\\.js$'],
  setupFiles: ['./src/__tests__/loadEnv.js'],
};
