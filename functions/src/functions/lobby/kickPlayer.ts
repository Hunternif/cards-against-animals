import * as logger from 'firebase-functions/logger';

import { assertLobbyControl, assertLoggedIn } from '../../api/auth-api';
import {
  getLobby,
  getPlayer,
  updatePlayer,
} from '../../api/lobby-server-repository';
import { KickAction } from '../../shared/types';
import { assertExhaustive } from '../../shared/utils';
import { CallableHandler } from '../function-utils';

/** Kicks player from the game. Allowed for creator and current judge. */
export const kickPlayerHandler: CallableHandler<
  { lobby_id: string; user_id: string; action: KickAction },
  void
> = async (event) => {
  assertLoggedIn(event);
  const lobby = await getLobby(event.data.lobby_id);
  await assertLobbyControl(event, lobby);
  const player = await getPlayer(lobby.id, event.data.user_id);
  if (player) {
    switch (event.data.action) {
      case 'kick':
        player.status = 'left';
        await updatePlayer(lobby.id, player);
        logger.info(`Soft-kicked player ${player.uid} from ${lobby.id}`);
        break;
      case 'ban':
        player.role = 'spectator';
        player.status = 'banned';
        await updatePlayer(lobby.id, player);
        logger.info(`Hard-banned player ${player.uid} from ${lobby.id}`);
        break;
      default:
        assertExhaustive(event.data.action);
    }
  }
};
