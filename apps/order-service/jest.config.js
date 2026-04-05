/** @type {import('jest').Config} */
module.exports = {
  displayName:    require('./package.json').name,
  preset:         'ts-jest',
  testEnvironment:'node',
  rootDir:        '.',
  testMatch:      ['**/__tests__/**/*.spec.ts'],
  moduleNameMapper: {
    '^@rms/shared-kernel$': '<rootDir>/../../packages/shared-kernel/src/index.ts',
    '^@rms/event-contracts$': '<rootDir>/../../packages/event-contracts/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  clearMocks:     true,
  collectCoverage: false,
};
