import * as logger from 'firebase-functions/logger';
import { assertLobbyControl } from '../../api/auth-api';
import { addPlayer } from '../../api/lobby-server-api';
import {
  getLobby,
  getPlayer,
  updatePlayer,
} from '../../api/lobby-server-repository';
import { CallableHandler } from '../function-utils';

/**
 * Will attempt to add a bot as player.
 */
export const addBotToLobbyHandler: CallableHandler<
  { lobby_id: string; bot_uid: string },
  void
> = async (event) => {
  // await sleep(2000);
  const { lobby_id: lobbyID, bot_uid: botUID } = event.data;
  const lobby = await getLobby(lobbyID);
  await assertLobbyControl(event, lobby);

  // Maybe the bot was kicked:
  const player = await getPlayer(lobbyID, botUID);
  if (player) {
    player.status = 'online';
    player.role = 'player';
    await updatePlayer(lobbyID, player);
  } else {
    await addPlayer(lobby, botUID);
  }
  logger.info(`Added bot ${botUID} to lobby ${lobbyID}`);
};
