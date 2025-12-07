export default {
  roots: [
    "src"
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  globals: {
    "extensionsToTreatAsEsm": [".ts"],
    "ts-jest": {
      useESM: true
    }
  },

  preset: 'ts-jest/presets/js-with-ts-esm',

  // from https://stackoverflow.com/a/57916712/15076557
  transformIgnorePatterns: [
    'node_modules/(?!(module-that-needs-to-be-transformed)/)'
  ],

  // Map @shared alias to the actual path
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1'
  },

  // Match only files containing ".test.ts"
  testMatch: ["**/__tests__/**/*(spec|test).[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"]
};