import { HttpsError } from 'firebase-functions/v1/auth';
import { assertLoggedIn } from '../../api/auth-api';
import { exchangeCards } from '../../api/exchange-cards-server-api';
import { getLobby, getPlayerState } from '../../api/lobby-server-repository';
import { CallableHandler } from '../function-utils';

/**
 * Discards the given cards from the player's hand and
 * attempts to exchange them with the requested tags.
 */
export const exchangeCardsHandler: CallableHandler<
  { lobby_id: string; card_ids: string[]; tags: string[] },
  void
> = async (event) => {
  const userID = assertLoggedIn(event);
  const lobbyID = event.data.lobby_id;
  const cardIDs = event.data.card_ids;
  const tags = event.data.tags;
  const playerState = await getPlayerState(lobbyID, userID);
  if (playerState == null) {
    throw new HttpsError('unauthenticated', 'Must be a player in lobby');
  }
  const lobby = await getLobby(lobbyID);
  await exchangeCards(lobby, playerState, cardIDs, tags);
};
