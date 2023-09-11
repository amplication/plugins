import { JestConfigWithTsJest } from "ts-jest";
const jestConfig : JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  rootDir: ".",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@root/(.*)$": "<rootDir>/$1",
    "^@events/(.*)$": "<rootDir>/src/events/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@tstatic/(.*)$": "<rootDir>/src/static/$1",
  },
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
};

export default jestConfig;