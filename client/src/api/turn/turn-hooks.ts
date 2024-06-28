import { collection, doc } from 'firebase/firestore';
import { useState } from 'react';
import {
  useCollectionData,
  useCollectionDataOnce,
  useDocumentData,
} from 'react-firebase-hooks/firestore';
import {
  FirestoreCollectionDataHookNullSafe,
  useCollectionDataNonNull,
} from '../../hooks/data-hooks';
import {
  playerResponseConverter,
  promptCardInGameConverter,
  responseCardInGameConverter,
  responseCardInHandConverter,
  turnConverter,
  voteConverter
} from '../../shared/firestore-converters';
import {
  GameLobby,
  GameTurn,
  PlayerResponse,
  PromptCardInGame,
} from '../../shared/types';
import { lobbiesRef } from '../lobby/lobby-repository';
import { getTurnsRef } from './turn-repository';

type LastTurnHook = [
  lastTurn: GameTurn | undefined,
  loading: boolean,
  error: any,
];

///////////////////////////////////////////////////////////////////////////////
//
//  React hooks for game Turns, when the game is in progress.
//
///////////////////////////////////////////////////////////////////////////////

/** Returns and subscribes to the current turn in the lobby. */
export function useLastTurn(lobby: GameLobby): LastTurnHook {
  // While the new turn is loading, return the previous turn:
  const [prevTurn, setPrevTurn] = useState<GameTurn | undefined>(undefined);
  const [lastTurn, loading, error] = useDocumentData(
    doc(getTurnsRef(lobby.id), lobby.current_turn_id),
  );
  if (lastTurn && prevTurn != lastTurn) {
    setPrevTurn(lastTurn);
  }
  return [lastTurn || prevTurn, loading, error];
}

/** Returns and subscribes to all turns in the lobby. */
export function useAllTurns(lobby: GameLobby) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, 'turns').withConverter(turnConverter),
  );
}

/** Returns to all turns in the lobby. */
export function useAllTurnsOnce(lobby: GameLobby) {
  return useCollectionDataOnce(
    collection(lobbiesRef, lobby.id, 'turns').withConverter(turnConverter),
  );
}

/** Returns and subscribes to current user's player hand in the current turn
 * in the lobby. */
export function usePlayerHand(lobby: GameLobby, userID: string) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, 'players', userID, 'hand').withConverter(
      responseCardInHandConverter,
    ),
  );
}

/** Returns to current user's player hand in the current turn in the lobby. */
export function usePlayerHandOnce(lobby: GameLobby, userID: string) {
  return useCollectionDataOnce(
    collection(lobbiesRef, lobby.id, 'players', userID, 'hand').withConverter(
      responseCardInHandConverter,
    ),
  );
}

/** Returns and subscribes to current user's player response that they played
 * in the current turn in the lobby. */
export function usePlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
) {
  return useDocumentData(
    doc(
      lobbiesRef,
      lobby.id,
      'turns',
      turn.id,
      'player_responses',
      userID,
    ).withConverter(playerResponseConverter),
  );
}

/** Returns and subscribes to all players responses that they played
 * in the current turn in the lobby. */
export function useAllPlayerResponses(lobby: GameLobby, turn: GameTurn) {
  return useCollectionDataNonNull(
    collection(
      lobbiesRef,
      lobby.id,
      'turns',
      turn.id,
      'player_responses',
    ).withConverter(playerResponseConverter),
  );
}

/** Returns to all players responses that they played
 * in the current turn in the lobby. */
export function useAllPlayerResponsesOnce(lobby: GameLobby, turn: GameTurn) {
  return useCollectionDataOnce(
    collection(
      lobbiesRef,
      lobby.id,
      'turns',
      turn.id,
      'player_responses',
    ).withConverter(playerResponseConverter),
  );
}

/** Returns and subscribes to current user's player discarded cards
 * in the current turn in the lobby. */
export function usePlayerDiscard(
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
) {
  return useCollectionDataNonNull(
    collection(
      lobbiesRef,
      lobby.id,
      'players',
      userID,
      'discarded',
    ).withConverter(responseCardInGameConverter),
  );
}

/** Returns and subscribes to the likes on the given player's response
 * in the current turn in the lobby. */
export function useResponseLikes(
  lobby: GameLobby,
  turn: GameTurn,
  response: PlayerResponse,
) {
  return useCollectionDataNonNull(
    collection(
      lobbiesRef,
      lobby.id,
      'turns',
      turn.id,
      'player_responses',
      response.player_uid,
      'likes',
    ).withConverter(voteConverter),
  );
}

/** Returns and subscribes to the prompt in the current turn in the lobby. */
export function useAllTurnPrompts(
  lobby: GameLobby,
  turn: GameTurn,
): FirestoreCollectionDataHookNullSafe<PromptCardInGame> {
  const promptsHook = useCollectionDataNonNull(
    collection(lobbiesRef, lobby.id, 'turns', turn.id, 'prompts').withConverter(
      promptCardInGameConverter,
    ),
  );
  // Check legacy prompt:
  if (turn.legacy_prompt) return [[turn.legacy_prompt], false, undefined];
  else return promptsHook;
}

/** Returns and subscribes to the votes on the given prompt card
 * in the current turn in the lobby. */
export function usePromptVotes(
  lobby: GameLobby,
  turn: GameTurn,
  prompt: PromptCardInGame,
) {
  return useCollectionDataNonNull(
    collection(
      lobbiesRef,
      lobby.id,
      'turns',
      turn.id,
      'prompts',
      prompt.id,
      'votes',
    ).withConverter(voteConverter),
  );
}
