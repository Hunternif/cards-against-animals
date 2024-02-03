![banner](https://raw.githubusercontent.com/Hunternif/cards-against-animals/main/client/public/banner.jpg)

# Project Setup

This guide assumes you have installed `Node.js` and `npm`. This repo contains 2 web projects: `client` and `functions`. The root file `package.json` contains scripts to manage both projects.

To begin, from command line, run the install script:
```sh
npm install
```

During building, files from the `shared` directory and `firebase-config.json` will be copied to `client` and `functions`, and the new copies will be ignored by Git. As the last step it will trigger Firebase setup.

### Firebase setup

Firebase requires a Firebase project, even when developing locally. To create a project, go to https://console.firebase.google.com/. The base plan is free. Add a "Web app" to your project and copy the Firebase SDK parameters to the file `firebase-config.json`, replacing example values. Then go back to command line to continue Firebase setup, and follow the prompts.

#### 1. Firebase features
To develop locally with emulators, you only need the feature `Emulators`. Otherwise, to deploy to production, you will need all these:
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
npm run build
```

# Run locally

To run the client:
```sh
npm run dev-client
```

To run Firebase emulators:
```sh
npm run dev-server
```

Client code will hot-reload automatically as you change it. But Firebase functions need to rebuilt manually each time you change them:
```sh
npm --prefix functions run build
```

### Run Unit Tests

```sh
npm run test
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

# Deploy to Production

```sh
firebase deploy
```
During deployment, `firebase-config.json` will be auto-updated to disable emulator, by setting `"useEmulator": false`.

Also note these additional values in `firebase-config.json`:

```js
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

In order to create card decks, you need to be an admin user. You can create a local admin user using Firebase emulators.

## Creating an admin user
Run the client and emulators, go to http://localhost:5173/admin, and click "Sign in with Google". The emulator will offer you to create a mock local account. Use any email address and username:

![Creating a mock Google account](https://raw.githubusercontent.com/Hunternif/cards-against-animals/main/docs/emulator_google_account_setup.png)

Go to you your Firestore emulator console at http://localhost:4000/firestore. You will see only one user with your name. Change the value `is_admin` to `true`:

![Setting id_admin on your user](https://raw.githubusercontent.com/Hunternif/cards-against-animals/main/docs/emulator_admin_user_setup.png)

## Uploading card decks
When logged in as a local admin user, you will have access to the admin console, and you can use it to upload decks at http://localhost:5173/admin/uploadDeck:

![Upload your test deck](https://raw.githubusercontent.com/Hunternif/cards-against-animals/main/docs/upload_test_deck.png)

-----
