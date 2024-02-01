![banner](https://raw.githubusercontent.com/Hunternif/cards-against-animals/main/client/public/banner.jpg)

# Project Setup

This guide assumes you have installed `Node.js` and `npm`. This repo contains 2 web projects: `client` and `functions`. Npm commands can be run from each web project directory (after `cd client`), or from the root directory using a prefix (e.g. `--prefix client`). Firebase commands must be always run from the root folder.


To begin, from command line, install the 2 projects:
```sh
cd client
npm install
npm run build

cd ../functions
npm install
npm run build

cd ..
```

During building, files from the `shared` directory and `firebase-config.json` will be copied to `client` and `functions`, and the new copies will be ignored by Git.

### Firebase setup

Firebase requires a Firebase project. Go to https://console.firebase.google.com/ to create one. If you only plan to develop locally using emulators, you can use the free plan. Add a "Web app" to your project and copy the Firebase SDK parameters to the file `firebase-config.json`, replacing example values.

From command line, from the root directory, initialize Firebase:

```sh
firebase init
```

#### 1. Firebase features
Follow the prompts to enable the needed features. To develop locally with emulators, you only need the feature `Emulators`. Otherwise, to deploy to production, you will need all these:
```
 (*) Firestore
 (*) Functions
 (*) Hosting (Firebase hosting)
 (*) Emulators
```

#### 2. Firebase project
The Firebase CLI tool will log in to your Google account and display your existing projects. Choose the project you created earlier.

#### 3. Firebase emulators
The following emulators must be enabled:
```
 (*) Authentication Emulator
 (*) Functions Emulator
 (*) Firestore Emulator
 (*) Hosting Emulator
```

After completing the above, rebuild your projects:
```
npm --prefix client run build
npm --prefix functions run build
```

# Run locally

To run the client:
```sh
npm --prefix client run dev
```

To run Firebase emulators:
```sh
firebase emulators:start --import=exported-dev-data --export-on-exit=exported-dev-data
```

Client code will hot-reload automatically as you change it. But Firebase functions need to rebuilt manually each time you change them:
```sh
npm --prefix functions run build
```

### Run Unit Tests

```sh
npm --prefix client run test
npm --prefix functions run test
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm --prefix client run lint
npm --prefix functions run lint
```

# Deploy to Production

```sh
firebase deploy
```
During deployment, `firebase-config.json` will be auto-updated to disable emulator, by setting `"useEmulator": false`.

Also note these additional values in `firebase-config.json`:

```json
{
  // Firebase SDK parameters:
  "apiKey": ...

  // "webUrl" is used to populate html headers with .../banner.jpg:
  "webUrl": "https://my-app.web.app"
  // "region" controls where the Firebase Cloud Functions are hosted:
  "region": "europe-west1",
  // "useEmulator" controls whether the client should connect to the local emulator or to prod:
  "useEmulator": true
}
```

# Test data setup

In order to create decks with cards, you need to be an admin user. You can create a fake admin using Firebase emulators.

## Creating an admin user
Run the emulators, head to http://localhost:5173/admin, and click "Sign in with Google". The emulator will offer you to create a mock account. Use any email address and username:

![Creating a mock Google account](https://raw.githubusercontent.com/Hunternif/cards-against-animals/main/docs/emulator_google_account_setup.png)

After that, go to http://localhost:5173/. This will initialize your user document in Firestore. Head to you your Firestore emulator console at http://127.0.0.1:4000/firestore. You will see only one user with your name. Change the value `is_admin` to `true`:

![Setting id_admin on your user](https://raw.githubusercontent.com/Hunternif/cards-against-animals/main/docs/emulator_admin_user_setup.png)

You will now have access to the admin console, and you can use it to upload decks at http://localhost:5173/admin/uploadDeck:

![Upload your test deck](https://raw.githubusercontent.com/Hunternif/cards-against-animals/main/docs/upload_test_deck.png)

-----
