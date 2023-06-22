export default {
  setupFiles: ['<rootDir>/jest.setup.js'],
  
  moduleNameMapper: {
    '^@app(.*)$': '<rootDir>/src/app$1',
    '^@web-server(.*)$': '<rootDir>/src/web-server$1',
  },

  testRegex: '.*\\.spec|test\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
};