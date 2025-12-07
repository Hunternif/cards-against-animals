import { PlayerResponse, PromptCardInGame } from '@shared/types';
import { getTurnPrompt } from '../turn/turn-prompt-api';
import { getAllTurns } from '../turn/turn-repository';
import { getAllPlayerResponses } from '../turn/turn-response-api';
import { getActivePlayerCount } from './lobby-player-api';

export type ResponseWithPrompt = {
  prompt: PromptCardInGame;
  response: PlayerResponse;
};

/** Returns the best responses from all turns in the lobby. */
export async function getBestAnswers(
  lobbyID: string,
): Promise<ResponseWithPrompt[]> {
  const out = new Array<ResponseWithPrompt>();
  const playerCount = await getActivePlayerCount(lobbyID);
  let minLikeCount = Math.floor(playerCount / 2);
  while (out.length === 0 && minLikeCount >= 0) {
    const allTurns = await getAllTurns(lobbyID);
    for (const turn of allTurns) {
      const responses = await getAllPlayerResponses(
        lobbyID,
        turn.id,
        minLikeCount,
      );
      if (responses.length <= 0) continue;
      const prompt = await getTurnPrompt(lobbyID, turn);
      if (prompt) {
        for (const response of responses) {
          out.push({ prompt, response });
        }
      }
    }
    // Reduce required like count in case we got no responses:
    minLikeCount--;
  }
  return out;
}
