/** @type {import('jest').Config} */
module.exports = {
  // Run unit tests across all packages and apps using ts-jest
  projects: [
    '<rootDir>/packages/shared-kernel',
    '<rootDir>/packages/event-contracts',
    '<rootDir>/apps/auth-service',
    '<rootDir>/apps/menu-service',
    '<rootDir>/apps/inventory-service',
    '<rootDir>/apps/order-service',
    '<rootDir>/apps/table-service',
    '<rootDir>/apps/staff-service',
    '<rootDir>/apps/notification-service',
    '<rootDir>/apps/reporting-service',
    '<rootDir>/apps/api-gateway',
  ],

  // Global coverage collection from all source files
  collectCoverageFrom: [
    'apps/*/src/**/*.ts',
    'packages/*/src/**/*.ts',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/*.dto.ts',
    '!**/*.schema.ts',
    '!**/*.interface.ts',
    '!**/index.ts',
  ],

  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',

  // Thresholds per the SRS testing strategy (90%+ branch for domain layer)
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 75,
      functions: 80,
      statements: 80,
    },
  },
};
