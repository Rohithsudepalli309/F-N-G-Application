module.exports = {
  testEnvironment: 'node',
  verbose: true,
  setupFilesAfterEnv: ['./src/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
};
