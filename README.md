## Project Setup

```sh
npm --prefix client install client
```

This will create the file `firebase-config.json`. Populate it with the data from your Firebase project. Then do:

```sh
firebase init
```

Note that files from the folder `shared` will be copied to `client` and `functions` during build, and the copies will be ignored by Git.

### Compile and Hot-Reload for Development

```sh
npm --prefix client run dev
```

To run firebase emulators:
```sh
firebase emulators:start --import=exported-dev-data --export-on-exit=exported-dev-data
```

When changing functions, rebuild them to see the changes in the emulator:
```sh
npm --prefix functions run build
```

### Type-Check, Compile and Minify for Production

```sh
firebase deploy
```
During deployment, `firebase-config.json` will be auto-updated to disable emulator, by setting `"useEmulator": false`.

### Run Unit Tests

```sh
npm --prefix client run test
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

-----

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
