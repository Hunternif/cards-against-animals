import { GameTurn, PlayerResponse, ResponseCardInGame } from '../shared/types';
import { assertExhaustive } from '../shared/utils';
import {
  getAllPlayerResponses,
  getPreviousTurn,
  updatePlayerResponse,
} from './turn-server-repository';

/** Updates the content for special cards in all players' responses. */
export async function updateResponsesContent(lobbyID: string, turn: GameTurn) {
  const responses = await getAllPlayerResponses(lobbyID, turn.id);
  // Sort resposnes in the same order as on the Card Reading Screen:
  responses.sort((r1, r2) => r1.random_index - r2.random_index);

  for (const [respIndex, response] of responses.entries()) {
    for (const [cardIndex, card] of response.cards.entries()) {
      let prevCard: ResponseCardInGame | undefined;
      switch (card.action) {
        case 'repeat_last':
          // Find previous card in the same response:
          if (cardIndex > 0) {
            prevCard = response.cards[cardIndex - 1];
          }
          break;
        case 'repeat_player_first':
          // Find the first card in the previous player's response:
          prevCard = await findPreviousResponseFirstCard(
            lobbyID,
            turn,
            responses,
            respIndex,
          );
          break;
        case 'repeat_player_last':
          // Find the last card in the previous player's response:
          prevCard = await findPreviousResponseLastCard(
            lobbyID,
            turn,
            responses,
            respIndex,
          );
          break;
        case 'none':
        case undefined:
          break;
        default:
          assertExhaustive(card.action);
      }
      if (prevCard) {
        card.content = prevCard.content;
        await updatePlayerResponse(lobbyID, turn.id, response);
      }
    }
  }
}

/** Finds the first card in the previous player's response. */
async function findPreviousResponseFirstCard(
  lobbyID: string,
  turn: GameTurn,
  /** Current turn's resposnes */
  responses: PlayerResponse[],
  /** Index of the current response */
  respIndex: number,
): Promise<ResponseCardInGame | undefined> {
  const prevResponse = await findPreviousResponse(
    lobbyID,
    turn,
    responses,
    respIndex,
  );
  if (prevResponse) {
    return prevResponse.cards[0];
  }
  return undefined;
}

/** Finds the last card in the previous player's response. */
async function findPreviousResponseLastCard(
  lobbyID: string,
  turn: GameTurn,
  /** Current turn's resposnes */
  responses: PlayerResponse[],
  /** Index of the current response */
  respIndex: number,
): Promise<ResponseCardInGame | undefined> {
  const prevResponse = await findPreviousResponse(
    lobbyID,
    turn,
    responses,
    respIndex,
  );
  if (prevResponse) {
    return prevResponse.cards[prevResponse.cards.length - 1];
  }
  return undefined;
}

/**
 * Returns the response from the previous player, if it exists.
 * If this is the first response in this turn, will look in the previous turn.
 */
async function findPreviousResponse(
  lobbyID: string,
  turn: GameTurn,
  /** Current turn's resposnes */
  responses: PlayerResponse[],
  /** Index of the current response */
  respIndex: number,
): Promise<PlayerResponse | undefined> {
  let prevResponse: PlayerResponse | undefined;
  if (respIndex > 0) {
    prevResponse = responses[respIndex - 1];
  } else {
    // Fetch previous turn's response:
    const prevTurn = await getPreviousTurn(lobbyID, turn);
    if (prevTurn) {
      const prevResponses = await getAllPlayerResponses(lobbyID, prevTurn.id);
      if (prevResponses.length > 0) {
        prevResponses.sort((r1, r2) => r1.random_index - r2.random_index);
        prevResponse = prevResponses[prevResponses.length - 1];
      }
    }
  }
  return prevResponse;
}
