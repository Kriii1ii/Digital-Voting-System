module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};

