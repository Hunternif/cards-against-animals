import { RNG } from '../shared/rng';
import { GameLobby, GameTurn, PlayerInLobby } from '../shared/types';
import { assertExhaustive } from '../shared/utils';
import {
  getOnlinePlayers,
  getPlayers,
  getPlayerState,
  updatePlayer,
} from './lobby-server-repository';
import { playResponse } from './turn-server-api';
import { getPlayerHand, getTurnPrompt } from './turn-server-repository';

export async function processBots(lobby: GameLobby, turn: GameTurn) {
  switch (turn.phase) {
    case 'new':
    case 'reading':
    case 'complete': {
      break;
    }
    case 'answering': {
      // Check all bots, answer immediately with random cards
      const bots = (await getPlayers(lobby.id)).filter((p) => p.is_bot);
      if (bots.length > 0) {
        const prompt = await getTurnPrompt(lobby.id, turn);
        if (prompt) {
          for (const bot of bots) {
            await playRandomResponse(lobby, turn, prompt.pick, bot);
          }
        }
      }
      break;
    }
    default:
      assertExhaustive(turn.phase);
  }
}

/**
 * Play random response.
 * If not enough cards, the player becomes spectator.
 */
async function playRandomResponse(
  lobby: GameLobby,
  turn: GameTurn,
  pick: number,
  player: PlayerInLobby,
) {
  const playerState = await getPlayerState(lobby.id, player.uid);
  if (!playerState) return;
  const rng = RNG.fromTimestamp();
  const hand = await getPlayerHand(lobby.id, playerState);
  rng.shuffleArray(hand);
  if (hand.length < pick) {
    // Not enough cards, spectate:
    player.role = 'spectator';
    await updatePlayer(lobby.id, player);
  } else {
    const response = hand.slice(0, pick);
    await playResponse(lobby, turn, player.uid, response);
  }
}
