import * as logger from 'firebase-functions/logger';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { cleanUpPlayer } from '../api/lobby-server-api';
import { setUsersCurrentLobby } from '../api/user-server-api';
import { playerConverter } from '@shared/firestore-converters';
import { assertExhaustive } from '@shared/utils';

/**
 * Clean-up logic to run when a player changes their status.
 * This a function so it doesn't get called during import.
 */
export const createOnPlayerStatusChangeHandler = () =>
  onDocumentUpdated('lobbies/{lobbyID}/players/{userID}', async (event) => {
    if (!event.data) return;
    const lobbyID = event.params.lobbyID;
    const userID = event.params.userID;
    const playerBefore = playerConverter.fromFirestore(event.data.before);
    const playerAfter = playerConverter.fromFirestore(event.data.after);
    if (playerBefore.status !== playerAfter.status) {
      switch (playerAfter.status) {
        case 'left':
        case 'banned':
          await cleanUpPlayer(lobbyID, playerAfter);
          break;
        case 'online':
          // Player rejoined, update current lobby ID:
          await setUsersCurrentLobby(userID, lobbyID);
          logger.info(
            `User ${playerAfter.name} (${userID}) is online in lobby ${lobbyID}`,
          );
          break;
        default:
          assertExhaustive(playerAfter.status);
      }
    }
  });
