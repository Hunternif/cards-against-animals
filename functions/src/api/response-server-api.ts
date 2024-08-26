import { GameTurn, PlayerResponse } from '../shared/types';
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
      switch (card.action) {
        case 'repeat_last':
          // Find previous card in the same response:
          if (cardIndex > 0) {
            card.content = response.cards[cardIndex - 1].content;
            await updatePlayerResponse(lobbyID, turn.id, response);
          }
          break;
        case 'repeat_last_player':
          // Find previous card in the previous player's response:
          let prevResponse: PlayerResponse | undefined;
          if (respIndex > 0) {
            prevResponse = responses[respIndex - 1];
          } else {
            // Fetch previous turn's response:
            const prevTurn = await getPreviousTurn(lobbyID, turn);
            if (prevTurn) {
              const prevResponses = await getAllPlayerResponses(
                lobbyID,
                prevTurn.id,
              );
              if (prevResponses.length > 0) {
                prevResponses.sort(
                  (r1, r2) => r1.random_index - r2.random_index,
                );
                prevResponse = prevResponses[prevResponses.length - 1];
              }
            }
          }
          if (prevResponse) {
            const lastCard = prevResponse.cards[prevResponse.cards.length - 1];
            card.content = lastCard.content;
            await updatePlayerResponse(lobbyID, turn.id, response);
          }
          break;
        case 'none':
        case undefined:
          break;
        default:
          assertExhaustive(card.action);
      }
    }
  }
}
