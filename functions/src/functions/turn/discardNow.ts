import { assertLoggedIn, assertPlayerInLobby } from '../../api/auth-api';
import { getLobby } from '../../api/lobby-server-repository';
import { discardNowAndDealCardsToPlayer } from '../../api/turn-server-api';
import { getLastTurn } from '../../api/turn-server-repository';
import { CallableHandler } from '../function-utils';

/**
 * Immediately remove discarded cards from the player's hand,
 * and deal new cards.
 */
export const discardNowHandler: CallableHandler<
  { lobby_id: string },
  void
> = async (event) => {
  const userID = assertLoggedIn(event);
  await assertPlayerInLobby(event, event.data.lobby_id);
  const lobby = await getLobby(event.data.lobby_id);
  const turn = await getLastTurn(lobby);
  if (turn) {
    await discardNowAndDealCardsToPlayer(lobby, turn, userID);
  }
};
