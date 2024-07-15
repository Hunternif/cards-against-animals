import { newGameHand } from '../../shared/mock-data';
import {
  defaultLobbySettings,
  GameLobby,
  PlayerGameState,
  ResponseCardInGame,
} from '../../shared/types';
import { copyFields } from '../../shared/utils';
import { getOrCreatePlayerState } from '../lobby-server-repository';
import { payDiscardCost } from '../turn-server-api';

// Maps player ID to player state
const mockPlayerDb = new Map<string, PlayerGameState>();

jest.mock('../lobby-server-repository', () => ({
  __esModule: true, // this property makes it work
  getPlayerState: jest.fn((lobbyID: string, userID: string) =>
    mockPlayerDb.get(userID),
  ),
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
}));

let lobby: GameLobby;
let player: PlayerGameState;
let discard: ResponseCardInGame[];

beforeEach(async () => {
  lobby = new GameLobby('001', 'p1', defaultLobbySettings());
  player = await getOrCreatePlayerState(lobby, 'p1');
  discard = newGameHand(2);

  // Set initial score:
  player.score = 10;
  player.discard_tokens = 5;
  mockPlayerDb.set(player.uid, player);
});

afterEach(() => mockPlayerDb.clear());

test('pay discard cost: free', async () => {
  lobby.settings.discard_cost = 'free';
  let success = await payDiscardCost(lobby, player, discard);
  let updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(1);

  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(2);
  expect(updatedPlayer.discard_tokens).toBe(5);
});

test('pay discard cost: no_discard', async () => {
  lobby.settings.discard_cost = 'no_discard';
  const success = await payDiscardCost(lobby, player, discard);
  const updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(false);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(0);
  expect(updatedPlayer.discard_tokens).toBe(5);
});

test('pay discard cost: 1_star', async () => {
  lobby.settings.discard_cost = '1_star';
  let success = await payDiscardCost(lobby, player, discard);
  let updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(9);
  expect(updatedPlayer.discards_used).toBe(1);

  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(8);
  expect(updatedPlayer.discards_used).toBe(2);

  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(7);
  expect(updatedPlayer.discards_used).toBe(3);
  expect(updatedPlayer.discard_tokens).toBe(5);

  // For 'star' cost, allow discarding indefinitely:
  player.score = 0;
  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(0);
  expect(updatedPlayer.discards_used).toBe(4);
});

test('pay discard cost: 1_free_then_1_star', async () => {
  lobby.settings.discard_cost = '1_free_then_1_star';
  let success = await payDiscardCost(lobby, player, discard);
  let updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(1);

  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(9);
  expect(updatedPlayer.discards_used).toBe(2);

  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(8);
  expect(updatedPlayer.discards_used).toBe(3);
  expect(updatedPlayer.discard_tokens).toBe(5);

  // For 'star' cost, allow discarding indefinitely:
  player.score = 0;
  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(0);
  expect(updatedPlayer.discards_used).toBe(4);
});

test('pay discard cost: token', async () => {
  lobby.settings.discard_cost = 'token';
  let success = await payDiscardCost(lobby, player, discard);
  let updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(1);
  expect(updatedPlayer.discard_tokens).toBe(4);

  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(true);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(2);
  expect(updatedPlayer.discard_tokens).toBe(3);

  player.discard_tokens = 0;
  success = await payDiscardCost(lobby, player, discard);
  updatedPlayer = mockPlayerDb.get(player.uid)!;
  expect(success).toBe(false);
  expect(updatedPlayer.score).toBe(10);
  expect(updatedPlayer.discards_used).toBe(2);
  expect(updatedPlayer.discard_tokens).toBe(0);
});
