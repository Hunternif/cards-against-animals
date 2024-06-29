import { discardNowFun } from '../../firebase';
import {
  GameLobby,
  PlayerInLobby,
  ResponseCardInGame,
} from '../../shared/types';
import { updatePlayer } from '../lobby/lobby-player-api';

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
  player: PlayerInLobby,
  cards: ResponseCardInGame[],
) {
  for (const card of cards) {
    player.discarded.set(card.id, card);
  }
  await updatePlayer(lobby.id, player);
}

/** Immediately discard cards marked as discarded, and deal new cards. */
export async function discardImmediately(
  lobby: GameLobby,
  player: PlayerInLobby,
  cards: ResponseCardInGame[],
) {
  await discardCards(lobby, player, cards);
  await discardNowFun({ lobby_id: lobby.id });
}
