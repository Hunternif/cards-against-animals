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
    "quotes": 0,
    "import/no-unresolved": 0,
    "indent": ["warn", 2],
    "object-curly-spacing": 0,
    "max-len": ["warn"],
    "require-jsdoc": 0,
    "valid-jsdoc": 0,
    "linebreak-style": 0,
    "eol-last": 0,
    "@typescript-eslint/no-empty-function": ["warn"],
    "@typescript-eslint/no-inferrable-types": 0,
    "camelcase": 0,
    "spaced-comment": 0,
    "comma-dangle": 0,
    "operator-linebreak": ["warn"],
    "space-before-function-paren": ["warn"],
  },
};
