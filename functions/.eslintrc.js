module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["warn", "double"],
    "import/no-unresolved": 0,
    "indent": ["warn", 2],
    "object-curly-spacing": ["warn", "always"],
    "max-len": ["warn"],
    "require-jsdoc": ["warn"],
    "valid-jsdoc": ["warn"],
    "linebreak-style": 0,
    "eol-last": 0,
    "@typescript-eslint/no-empty-function": ["warn"],
    "@typescript-eslint/no-inferrable-types": 0,
    "camelcase": 0,
    "spaced-comment": 0,
    "comma-dangle": 0,
  },
};
