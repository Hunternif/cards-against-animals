import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v1/auth';
import {
  GameLobby,
  PlayerGameState,
  ResponseCardInGame,
} from '@shared/types';
import { logCardInteractions } from './log-server-api';
import { dealCardsToPlayer, payDiscardCost } from './turn-server-api';

/**
 * Exchanges given cards from the player's hand for new cards
 * with the requested tag names.
 * @param lobby
 * @param playerState
 * @param cardIDs
 * @param tagNames
 */
export async function exchangeCards(
  lobby: GameLobby,
  playerState: PlayerGameState,
  cardIDs: string[],
  tagNames: string[],
) {
  if (cardIDs.length === 0) return;
  const userID = playerState.uid;

  // Pay discard cost:
  if (!(await payDiscardCost(lobby, playerState))) {
    throw new HttpsError(
      'failed-precondition',
      `Player ${userID} Could not pay discard cost`,
    );
  }
  // Remove cards from the player's hand:
  const discardedCards = new Array<ResponseCardInGame>();
  for (const cardID of cardIDs) {
    const card = playerState.hand.get(cardID);
    if (card) {
      playerState.hand.delete(cardID);
      discardedCards.push(card);
    }
  }
  logger.info(`Exchanging ${cardIDs.length} cards from player ${userID}`);

  // Find how many more cards we need:
  const cardsPerPerson = lobby.settings.cards_per_person;
  const totalCardsNeeded = Math.max(0, cardsPerPerson - playerState.hand.size);
  logger.info(
    `Trying to deal ${totalCardsNeeded} cards to player ${userID}...`,
  );

  await dealCardsToPlayer(lobby, playerState, tagNames);
  // Log discarded cards:
  await logCardInteractions(lobby, {
    discardedResponses: discardedCards,
  });
}
