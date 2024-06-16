import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import {
  getAllPlayerResponses,
  logInteractionsInCompletePhase,
  logInteractionsInReadingPhase,
  logPlayedPrompt,
  updatePlayerScoresFromTurn,
  updateTurn,
} from '../api/turn-server-api';
import { turnConverter } from '../shared/firestore-converters';
import { assertExhaustive } from '../shared/utils';

/** Logic to run after each turn phase. */
export const onTurnPhaseChangeTrigger = onDocumentUpdated(
  'lobbies/{lobbyID}/turns/{turnID}',
  async (event) => {
    if (!event.data) return;
    const lobbyID = event.params.lobbyID;
    const turnBefore = turnConverter.fromFirestore(event.data.before);
    const turnAfter = turnConverter.fromFirestore(event.data.after);
    if (turnBefore.phase !== turnAfter.phase) {
      // Changed phase
      switch (turnAfter.phase) {
        case 'new':
          break;
        case 'answering': {
          await logPlayedPrompt(lobbyID, turnAfter);
          break;
        }
        case 'reading': {
          // All responses submitted: log interactions.
          await logInteractionsInReadingPhase(lobbyID, turnAfter);
          break;
        }
        case 'complete': {
          // Turn completed: update all scores.
          const responses = await getAllPlayerResponses(lobbyID, turnAfter.id);
          await updatePlayerScoresFromTurn(lobbyID, turnAfter, responses);
          await logInteractionsInCompletePhase(lobbyID, turnAfter, responses);
          break;
        }
        default:
          assertExhaustive(turnAfter.phase);
      }
      // Update phase timestamp
      if (
        turnBefore.phase_start_time.getUTCMilliseconds() ===
        turnAfter.phase_start_time.getUTCMilliseconds()
      ) {
        turnAfter.phase_start_time = new Date();
        await updateTurn(lobbyID, turnAfter);
      }
    }
  },
);
