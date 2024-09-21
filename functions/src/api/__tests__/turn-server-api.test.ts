import {
  defaultLobbySettings,
  GameLobby,
  GameTurn,
  PlayerGameState,
  PlayerRole,
} from '../../shared/types';
import { copyFields } from '../../shared/utils';
import { getLobby, getOrCreatePlayerState } from '../lobby-server-repository';
import { payDiscardCost, updatePlayerScoresFromTurn } from '../turn-server-api';

// Maps player ID to player state
const mockPlayerDb = new Map<string, PlayerGameState>();

jest.mock('../lobby-server-repository', () => ({
  __esModule: true, // this property makes it work
  getPlayerState: jest.fn((lobbyID: string, userID: string) =>
    mockPlayerDb.get(userID),
  ),
  getPlayerStates: jest.fn((lobbyID: string) => [...mockPlayerDb.values()]),
  getOrCreatePlayerState: jest.fn((lobby: GameLobby, userID: string) => {
    if (mockPlayerDb.has(userID)) return mockPlayerDb.get(userID);
    const discard_tokens = lobby.settings.init_discard_tokens;
    const state = new PlayerGameState(userID, 0, 0, 0, 0, discard_tokens);
    // Copy player object to prevent overwriting the original:
    mockPlayerDb.set(state.uid, copyFields(state));
    return state;
  }),
  updatePlayerState: jest.fn((lobbyID: string, state: PlayerGameState) =>
    mockPlayerDb.set(state.uid, state),
  ),
  countOnlinePlayers: jest.fn(
    (lobbyID: string, role?: PlayerRole) => mockPlayerDb.size,
  ),
}));

let lobby: GameLobby;
let player: PlayerGameState;

beforeEach(async () => {
  lobby = new GameLobby('001', 'p1', defaultLobbySettings());
  player = await getOrCreatePlayerState(lobby, 'p1');

  // Set initial score:
  player.score = 10;
  player.discard_tokens = 5;
  mockPlayerDb.set(player.uid, player);
  lobby.settings.max_discard_tokens = 10;
});

afterEach(() => mockPlayerDb.clear());

test('pay discard cost: free', async () => {
  lobby.settings.discard_cost = 'free';
  let success = await payDiscardCost(lobby, player);
  let updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(1);

  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(2);
  expect(updatedPlayer.discard_tokens).toBe(5);
});

test('pay discard cost: no_discard', async () => {
  lobby.settings.discard_cost = 'no_discard';
  const success = await payDiscardCost(lobby, player);
  const updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(false);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(0);
  expect(updatedPlayer.discard_tokens).toBe(5);
});

test('pay discard cost: 1_star', async () => {
  lobby.settings.discard_cost = '1_star';
  let success = await payDiscardCost(lobby, player);
  let updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(9);
  expect(updatedPlayer.discards_used).toBe(1);

  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(8);
  expect(updatedPlayer.discards_used).toBe(2);

  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(7);
  expect(updatedPlayer.discards_used).toBe(3);
  expect(updatedPlayer.discard_tokens).toBe(5);

  // For 'star' cost, allow discarding indefinitely:
  player.score = 0;
  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(0);
  expect(updatedPlayer.discards_used).toBe(4);
});

test('pay discard cost: 1_free_then_1_star', async () => {
  lobby.settings.discard_cost = '1_free_then_1_star';
  let success = await payDiscardCost(lobby, player);
  let updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(1);

  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(9);
  expect(updatedPlayer.discards_used).toBe(2);

  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(8);
  expect(updatedPlayer.discards_used).toBe(3);
  expect(updatedPlayer.discard_tokens).toBe(5);

  // For 'star' cost, allow discarding indefinitely:
  player.score = 0;
  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(0);
  expect(updatedPlayer.discards_used).toBe(4);
});

test('pay discard cost: token', async () => {
  lobby.settings.discard_cost = 'token';
  let success = await payDiscardCost(lobby, player);
  let updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(1);
  expect(updatedPlayer.discard_tokens).toBe(4);

  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(2);
  expect(updatedPlayer.discard_tokens).toBe(3);

  player.discard_tokens = 0;
  success = await payDiscardCost(lobby, player);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(false);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(2);
  expect(updatedPlayer.discard_tokens).toBe(0);
});

test('award tokens: 0 wins => token every 2 turns', async () => {
  // 0 wins: get a token every 2 turns:
  await verifyDiscardTokenDistribution(
    lobby,
    player,
    3,
    [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
  );
});

test('award tokens: 1 win => token every 3 turns', async () => {
  // 1 wins: get a token every 3 turns:
  player.wins = 1;
  await verifyDiscardTokenDistribution(
    lobby,
    player,
    3,
    [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4],
  );
});

test('award tokens: 2 wins, 3 players => token every 3 turns', async () => {
  // 2 wins: get a token every 4 turns.
  // But it's limited to 3 because player count is 3:
  player.wins = 2;
  await verifyDiscardTokenDistribution(
    lobby,
    player,
    3,
    [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4],
  );
});

test('award tokens: 2 wins, 4 players => token every 4 turns', async () => {
  // 2 wins, 4 players: get a token every 4 turns.
  player.wins = 2;
  await verifyDiscardTokenDistribution(
    lobby,
    player,
    4,
    [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4],
  );
});

test('award tokens: 1 win, max_tokens = 2 => token every 3 turns, up to 2', async () => {
  lobby.settings.max_discard_tokens = 2;
  player.wins = 1;
  await verifyDiscardTokenDistribution(
    lobby,
    player,
    4,
    [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  );
});

/*
 * Verifies that the player gets the expected number of tokens each turn.
 * E.g.: [1, 1, 2, 2, 3, ...]
 * turn 1:  1 token
 * turn 2:  1 token
 * turn 3:  2 tokens
 * turn 4:  2 tokens
 * turn 5:  3 tokens
 * ...
 */
async function verifyDiscardTokenDistribution(
  lobby: GameLobby,
  player: PlayerGameState,
  playerCount: number,
  tokenCounts: number[],
) {
  const turn = new GameTurn('turn_01', 1, player.uid);
  // Create extra players, because player count affects max token count:
  for (let i = 1; i < playerCount; i++) {
    await getOrCreatePlayerState(lobby, `extra_player_${i}`);
  }
  // Increment turns ordinal and update score:
  player.discard_tokens = 0;
  const actualTokenCounts = new Array<number>(tokenCounts.length);
  for (let i = 0; i < tokenCounts.length; i++) {
    turn.ordinal = i;
    await updatePlayerScoresFromTurn(lobby, turn, []);
    actualTokenCounts[i] = player.discard_tokens;
  }
  expect(actualTokenCounts).toEqual(tokenCounts);
}
