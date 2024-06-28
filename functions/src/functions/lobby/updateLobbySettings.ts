import * as logger from 'firebase-functions/logger';

import { assertLobbyControl, assertLoggedIn } from '../../api/auth-api';
import { getLobby, updateLobby } from '../../api/lobby-server-repository';
import { LobbySettings } from '../../shared/types';
import { CallableHandler } from '../function-utils';

/** Updates lobby settings. Allowed for creator and current judge. */
export const updateLobbySettingsHandler: CallableHandler<
  { lobby_id: string; settings: LobbySettings },
  void
> = async (event) => {
  assertLoggedIn(event);
  const lobby = await getLobby(event.data.lobby_id);
  await assertLobbyControl(event, lobby);
  lobby.settings = event.data.settings;
  await updateLobby(lobby);
  logger.info(`Updated settings for lobby ${lobby.id}`);
};
