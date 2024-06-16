import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { logDownvotes } from '../api/deck-server-api';
import { cleanUpEndedLobby } from '../api/lobby-server-api';
import { lobbyConverter } from '../shared/firestore-converters';

/** Logic to run after lobby status changes. */
export const onLobbyStatusChangeTrigger = onDocumentUpdated(
  'lobbies/{lobbyID}',
  async (event) => {
    if (!event.data) return;
    const lobbyBefore = lobbyConverter.fromFirestore(event.data.before);
    const lobbyAfter = lobbyConverter.fromFirestore(event.data.after);
    if (lobbyBefore.status !== lobbyAfter.status) {
      if (lobbyAfter.status === 'ended') {
        // Cleanup after a lobby ends:
        await cleanUpEndedLobby(lobbyAfter.id);
        // Apply downvotes to the deck:
        await logDownvotes(lobbyAfter.id);
      }
    }
  },
);
