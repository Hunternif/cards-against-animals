import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { getLobby } from '../api/lobby-server-repository';
import {
  logInteractionsInCompletePhase,
  logInteractionsInReadingPhase,
  logPlayedPrompt,
} from '../api/log-server-api';
import { updateResponsesContent } from '../api/response-server-api';
import { updatePlayerScoresFromTurn } from '../api/turn-server-api';
import {
  clearTurnTimer,
  getAllPlayerResponses,
  updateTurn,
} from '../api/turn-server-repository';
import { turnConverter } from '../shared/firestore-converters';
import { assertExhaustive } from '../shared/utils';
import { processBots } from '../api/bot-server-api';

/**
 * Logic to run after each turn phase.
 * This a function so it doesn't get called during import.
 */
export const createOnTurnPhaseChangeHandler = () =>
  onDocumentUpdated('lobbies/{lobbyID}/turns/{turnID}', async (event) => {
    if (!event.data) return;
    const lobbyID = event.params.lobbyID;
    const lobby = await getLobby(lobbyID);
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
          // All responses submitted: update content and log interactions.
          await updateResponsesContent(lobbyID, turnAfter);
          await logInteractionsInReadingPhase(lobbyID, turnAfter);
          break;
        }
        case 'complete': {
          // Turn completed: update all scores.
          const responses = await getAllPlayerResponses(lobbyID, turnAfter.id);
          await updatePlayerScoresFromTurn(lobby, turnAfter, responses);
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
        const now = new Date();
        turnAfter.phase_start_time = now;
        const phaseDurationSec = lobby.settings.answer_time_sec;
        if (turnAfter.phase === 'answering' && phaseDurationSec > 0) {
          turnAfter.phase_end_time = new Date(
            now.getTime() + phaseDurationSec * 1000,
          );
          await updateTurn(lobbyID, turnAfter);
        } else {
          await clearTurnTimer(lobbyID, turnAfter);
        }
      }
      await processBots(lobby, turnAfter);
    }
  });
