import { discardNowFun } from '../../firebase';
import {
  GameLobby,
  PlayerGameState,
  ResponseCardInGame,
} from '../../shared/types';
import { updatePlayerState } from '../lobby/lobby-player-api';

///////////////////////////////////////////////////////////////////////////////
//
//  Repository & API for discarding cards from the player's hand.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Set cards as discarded. At a later point (e.g. next turn or immediately),
 * these cards will be removed from player's hand, and cost will be deducted.
 */
export async function discardCards(
  lobby: GameLobby,
  playerState: PlayerGameState,
  cards: ResponseCardInGame[],
) {
  for (const card of cards) {
    playerState.discarded.set(card.id, card);
  }
  await updatePlayerState(lobby.id, playerState);
}

/** Immediately discard cards marked as discarded, and deal new cards. */
export async function discardImmediately(
  lobby: GameLobby,
  playerState: PlayerGameState,
  cards: ResponseCardInGame[],
) {
  await discardCards(lobby, playerState, cards);
  await discardNowFun({ lobby_id: lobby.id });
}
