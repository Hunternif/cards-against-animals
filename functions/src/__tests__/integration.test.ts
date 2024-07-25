import admin from 'firebase-admin';
import firebaseConfig from '../firebase-config.json';

//========= Set up Firebase mocks before importing any APIs ==========
// See links for more info:
// https://firebase.google.com/docs/emulator-suite/connect_firestore#admin_sdks
// https://github.com/firebase/firebase-admin-node/issues/776
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';

const testFirebaseApp = admin.initializeApp({
  projectId: firebaseConfig.projectId,
  credential: admin.credential.applicationDefault(),
});
const testFirebaseAuth = testFirebaseApp.auth();
const testFirestore = testFirebaseApp.firestore();
jest.mock('../firebase-server', () => ({
  firebaseApp: testFirebaseApp,
  firebaseAuth: testFirebaseAuth,
  firestore: testFirestore,
}));
//====================================================================
// Can import APIs now:

import { addPlayer, createLobby, endLobby } from '../api/lobby-server-api';

// This test requries emulator to be running.

let mrSmithUid: string;
let playerTomUid: string;

beforeEach(async () => {
  mrSmithUid = (
    await testFirebaseAuth.createUser({
      email: 'smith@test.com',
      emailVerified: true,
      displayName: 'Mr Smith',
    })
  ).uid;
  playerTomUid = (
    await testFirebaseAuth.createUser({
      displayName: 'Player Tom',
    })
  ).uid;
});

afterEach(async () => {
  testFirebaseAuth.deleteUsers([mrSmithUid, playerTomUid]);
});

test('integration: create lobby', async () => {
  const lobby = await createLobby(mrSmithUid);
  console.log(`Created lobby ${lobby.id}`);
  await addPlayer(lobby, mrSmithUid);
  await addPlayer(lobby, playerTomUid);
  await endLobby(lobby);
}, 120000); // Long test
