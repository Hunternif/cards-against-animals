import * as logger from 'firebase-functions/logger';

import { assertLoggedIn, assertPlayerInLobby } from '../../api/auth-api';
import { getLobby } from '../../api/lobby-server-repository';
import { logCardInteractions } from '../../api/log-server-api';
import { PromptCardInGame, ResponseCardInGame } from '@shared/types';
import { CallableHandler } from '../function-utils';

/**
 * Logs impression on a set of cards, when they were viewed for the first time
 * by a player in a lobby, and when they are played.
 * - Prompt impression should be logged only the "judge" who picked it.
 * - Response impression should be logged only by the player who was dealt it.
 *   Response impression can be logged once per turn, so that unplayed cards
 *   will accumulate more views over multiple turns.
 */
export const logInteractionHandler: CallableHandler<
  {
    lobby_id: string;
    viewed_prompts: PromptCardInGame[];
    viewed_responses: ResponseCardInGame[];
    played_prompts: PromptCardInGame[];
    played_responses: ResponseCardInGame[];
    discarded_prompts: PromptCardInGame[];
    discarded_responses: ResponseCardInGame[];
    won_responses: ResponseCardInGame[];
  },
  void
> = async (event) => {
  assertLoggedIn(event);
  await assertPlayerInLobby(event, event.data.lobby_id);
  const lobby = await getLobby(event.data.lobby_id);
  await logCardInteractions(lobby, {
    viewedPrompts: event.data.viewed_prompts,
    viewedResponses: event.data.viewed_responses,
    playedPrompts: event.data.played_prompts,
    playedResponses: event.data.played_responses,
    discardedPrompts: event.data.discarded_prompts,
    discardedResponses: event.data.discarded_responses,
    wonResponses: event.data.won_responses,
  });
  const total =
    event.data.viewed_prompts.length +
    event.data.played_prompts.length +
    event.data.viewed_responses.length +
    event.data.played_responses.length;
  logger.info(`Logged ${total} interactions`);
};
