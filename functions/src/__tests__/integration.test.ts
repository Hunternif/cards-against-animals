//========= Set up Firebase mocks before importing any APIs ==========
import { testFirebaseAuth } from './firebase-emulator';
import './mock-rng';
//====================================================================
// Can import APIs now:

import {
  addPlayer,
  createLobby,
  endLobby,
  startLobby,
} from '../api/lobby-server-api';
import {
  getPlayer,
  getPlayerState,
  updateLobby,
} from '../api/lobby-server-repository';
import { getPlayerHand } from '../api/turn-server-repository';
import { mockRNG } from './mock-rng';

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

test('integration: create lobby and deal cards', async () => {
  const lobby = await createLobby(mrSmithUid);
  console.log(`Created lobby ${lobby.id}`);
  try {
    mockRNG(); // Make predictable RNG
    await addPlayer(lobby, mrSmithUid);
    await addPlayer(lobby, playerTomUid);

    // TODO: import test deck data
    lobby.deck_ids.add('Test deck two');
    lobby.settings.cards_per_person = 5;
    lobby.settings.freeze_stats = true;
    lobby.settings.sort_by_id = true;
    await updateLobby(lobby);

    await startLobby(lobby);
    const playerSmith = (await getPlayer(lobby.id, mrSmithUid))!;
    const playerTom = (await getPlayer(lobby.id, playerTomUid))!;
    expect(playerSmith.random_index).toBe(1);
    expect(playerTom.random_index).toBe(2);

    // Verify dealt cards:
    const smithState = (await getPlayerState(lobby.id, mrSmithUid))!;
    expect(smithState.hand.size).toBe(5);
    expect([...smithState.hand.keys()]).toEqual([
      'Test deck two_0001',
      'Test deck two_0002',
      'Test deck two_0003',
      'Test deck two_0004',
      'Test deck two_0005',
    ]);
    const tomState = (await getPlayerState(lobby.id, playerTomUid))!;
    expect(tomState.hand.size).toBe(5);
    expect([...tomState.hand.keys()]).toEqual([
      'Test deck two_0006',
      'Test deck two_0007',
      'Test deck two_0008',
      'Test deck two_0009',
      'Test deck two_0010',
    ]);
  } finally {
    await endLobby(lobby);
  }
}, 120000); // Long test
