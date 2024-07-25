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
import {
  createNewTurn,
  discardNowAndDealCardsToPlayer,
  playPrompt,
  playResponse,
} from '../api/turn-server-api';
import { addPlayerDiscard, getLastTurn, updateTurn } from '../api/turn-server-repository';
import { PromptCardInGame } from '../shared/types';
import { mockRNG } from './mock-rng';

// This test requries emulator to be running.

let mrSmithUid: string;
let playerTomUid: string;
let resetRNG: Function;

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
  resetRNG = mockRNG(); // Make predictable RNG
});

afterEach(async () => {
  testFirebaseAuth.deleteUsers([mrSmithUid, playerTomUid]);
  resetRNG();
});

test('integration: create lobby and deal cards', async () => {
  const lobby = await createLobby(mrSmithUid);
  console.log(`Created lobby ${lobby.id}`);
  try {
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
    expect([...smithState.hand.keys()]).toEqual([
      'Test deck two_0001',
      'Test deck two_0002',
      'Test deck two_0003',
      'Test deck two_0004',
      'Test deck two_0005',
    ]);
    const tomState = (await getPlayerState(lobby.id, playerTomUid))!;
    expect([...tomState.hand.keys()]).toEqual([
      'Test deck two_0006',
      'Test deck two_0007',
      'Test deck two_0008',
      'Test deck two_0009',
      'Test deck two_0010',
    ]);

    // Play prompt and response
    const turn1 = (await getLastTurn(lobby))!;
    expect(turn1.judge_uid).toBe(mrSmithUid);
    const prompt1 = new PromptCardInGame(
      'prompt001',
      'no_deck',
      '001',
      0,
      'Test prompt! _ or _',
      2,
      0,
      [],
    );
    await playPrompt(lobby, turn1, prompt1);
    const tomHand = [...tomState.hand.values()];
    await playResponse(lobby, turn1, playerTomUid, [tomHand[1], tomHand[2]]);

    turn1.phase = 'reading';
    await updateTurn(lobby.id, turn1);
    turn1.winner_uid = playerTomUid;
    turn1.phase = 'complete';
    await updateTurn(lobby.id, turn1);

    const turn2 = await createNewTurn(lobby);
    // Verify dealt cards again:
    const smithState2 = (await getPlayerState(lobby.id, mrSmithUid))!;
    expect([...smithState2.hand.keys()]).toEqual([
      'Test deck two_0001',
      'Test deck two_0002',
      'Test deck two_0003',
      'Test deck two_0004',
      'Test deck two_0005',
    ]);
    const tomState2 = (await getPlayerState(lobby.id, playerTomUid))!;
    expect([...tomState2.hand.keys()]).toEqual([
      'Test deck two_0006',
      'Test deck two_0009',
      'Test deck two_0010',
      'Test deck two_0011',
      'Test deck two_0012',
    ]);

    // Do some discards:
    const smithHand = [...smithState2.hand.values()];
    await addPlayerDiscard(lobby.id, smithState2, [smithHand[1], smithHand[3]]);
    await discardNowAndDealCardsToPlayer(lobby, turn2, mrSmithUid);
    const smithState3 = (await getPlayerState(lobby.id, mrSmithUid))!;
    expect([...smithState3.hand.keys()]).toEqual([
      'Test deck two_0001',
      'Test deck two_0003',
      'Test deck two_0005',
      'Test deck two_0013',
      'Test deck two_0014',
    ]);
  } finally {
    await endLobby(lobby);
  }
}, 120000); // Long test
