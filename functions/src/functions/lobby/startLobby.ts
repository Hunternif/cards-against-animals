import { assertLobbyCreator, assertLoggedIn } from '../../api/auth-api';
import { getLobby, startLobbyInternal } from '../../api/lobby-server-api';
import { CallableHandler } from '../function-utils';

/** Completes lobby setup and starts the game. */
export const startLobbyHandler: CallableHandler<
  { lobby_id: string },
  void
> = async (event) => {
  assertLoggedIn(event);
  const lobby = await getLobby(event.data.lobby_id);
  assertLobbyCreator(event, lobby);
  await startLobbyInternal(lobby);
};
