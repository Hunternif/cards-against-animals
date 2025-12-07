import { doc, runTransaction } from 'firebase/firestore';
import { firestore, newTurnFun } from '../../firebase';
import { GameLobby, GameTurn } from '@shared/types';
import { getActivePlayerCount } from '../lobby/lobby-player-api';
import { getResponseLikeCount } from './turn-like-api';
import { updateTurn } from './turn-repository';
import {
  getAllPlayerResponses,
  getPlayerResponsesRef,
} from './turn-response-api';

///////////////////////////////////////////////////////////////////////////////
//
//  API for controlling a game turn, when the game is in progress.
//
///////////////////////////////////////////////////////////////////////////////

/** Begins a new turn. Current turn value ensures idempotency. */
export async function startNewTurn(lobby: GameLobby, currentTurn: GameTurn) {
  await newTurnFun({ lobby_id: lobby.id, current_turn_id: currentTurn.id });
}

/**
 * Proceeds turn to reading phase.
 * If not all players responded, throws an exception.
 */
export async function startReadingPhase(lobby: GameLobby, turn: GameTurn) {
  if (turn.phase !== 'answering') {
    throw new Error(`Invalid turn phase to start reading: ${turn.phase}`);
  }
  const timeRanOut =
    turn.phase_end_time && new Date().getTime() > turn.phase_end_time.getTime();
  // If time ran out, you can continue:
  if (timeRanOut) {
    turn.phase = 'reading';
    await updateTurn(lobby.id, turn);
  } else {
    // We still have time, so wait for all players.
    // TODO: throw a special error class
    const notAllRespondedError = new Error('Not all players responded');
    const responses = await getAllPlayerResponses(lobby.id, turn.id);
    const playerCount = await getActivePlayerCount(lobby.id);
    // -1 because of judge
    if (responses.length < playerCount - 1) {
      throw notAllRespondedError;
    }
    await runTransaction(firestore, async (transaction) => {
      // Ensure responses have not been modified:
      const updatedResponses = await Promise.all(
        responses.map((resp) =>
          transaction.get(
            doc(getPlayerResponsesRef(lobby.id, turn.id), resp.player_uid),
          ),
        ),
      );
      for (let updatedResp of updatedResponses) {
        if (!updatedResp.exists()) {
          throw notAllRespondedError;
        }
      }
      turn.phase = 'reading';
      await updateTurn(lobby.id, turn, transaction);
    });
  }
}

/**
 * Set winner of the current turn and set it to "complete".
 * Also awards "audience choice award" to responses with the most likes
 */
export async function chooseWinner(
  lobby: GameLobby,
  turn: GameTurn,
  winnerID: string,
) {
  turn.winner_uid = winnerID;
  await selectAudienceAwardWinners(lobby.id, turn);
  turn.phase = 'complete';
  await updateTurn(lobby.id, turn);
}

/** Choose responses with the most likes and add them to audience_award_uids */
async function selectAudienceAwardWinners(lobbyID: string, turn: GameTurn) {
  // Played cards:
  const responses = await getAllPlayerResponses(lobbyID, turn.id);
  if (responses.length === 0) return;
  let maxLikes = -1;
  let audienceWinners = Array<string>();
  for (const resp of responses) {
    const likeCount = await getResponseLikeCount(
      lobbyID,
      turn.id,
      resp.player_uid,
    );
    if (likeCount == maxLikes) {
      audienceWinners.push(resp.player_uid);
    } else if (likeCount > 0 && likeCount > maxLikes) {
      audienceWinners = [resp.player_uid];
      maxLikes = likeCount;
    }
  }
  turn.audience_award_uids = audienceWinners;
}
