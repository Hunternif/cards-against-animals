import * as logger from 'firebase-functions/logger';

import { assertLoggedIn, assertPlayerInLobby } from '../../api/auth-api';
import { getLobby } from '../../api/lobby-server-repository';
import { createNewTurn } from '../../api/turn-server-api';
import { CallableHandler } from '../function-utils';

/** Begins new turn. Current turn id ensures idempotency. */
export const newTurnHandler: CallableHandler<
  { lobby_id: string; current_turn_id: string },
  void
> = async (event) => {
  assertLoggedIn(event);
  const lobby = await getLobby(event.data.lobby_id);
  await assertPlayerInLobby(event, lobby.id);
  // Allow players to start a new turn whenever:
  // const lastTurn = await getLastTurn(lobby.id);
  // if (lastTurn && lastTurn.phase != "complete") {
  //   throw new HttpsError("failed-precondition", "Last turn is not complete");
  // }
  // Ensure current turn is the same:
  if (lobby.current_turn_id !== event.data.current_turn_id) {
    logger.warn(
      `Attempt to start new turn at the wrong time in lobby ${lobby.id}`,
    );
  } else {
    await createNewTurn(lobby);
    logger.info(`Started new turn in lobby ${lobby.id}`);
  }
};
