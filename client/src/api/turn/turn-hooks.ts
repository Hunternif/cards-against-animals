import { collection, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  useCollection,
  useCollectionData,
  useCollectionDataOnce,
  useDocument,
  useDocumentData,
} from 'react-firebase-hooks/firestore';
import {
  FirestoreCollectionDataHookNullSafe,
  useCollectionDataNonNull,
} from '../../hooks/data-hooks';
import {
  playerResponseConverter,
  promptCardInGameConverter,
  turnConverter,
  voteConverter,
} from '../../shared/firestore-converters';
import {
  GameLobby,
  GameTurn,
  PlayerResponse,
  PromptCardInGame,
} from '../../shared/types';
import { lobbiesRef } from '../lobby/lobby-repository';
import { getResponseLikesRef } from './turn-like-api';
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
    doc(getTurnsRef(lobby.id), lobby.current_turn_id ?? 'UNKNOWN'),
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

/** Subscribes to like count on the given player's response. */
export function useResponseLikeCount(
  lobby: GameLobby,
  turn: GameTurn,
  response: PlayerResponse,
): number {
  const [snapshots] = useCollection(
    getResponseLikesRef(lobby.id, turn.id, response.player_uid),
  );
  // update data so it's available across the app:
  response.like_count = snapshots?.docs.length ?? 0;
  return response.like_count;
}

/** Returns if true if this response has the current player's like. */
export function useResponseMyLike(
  lobby: GameLobby,
  turn: GameTurn,
  response: PlayerResponse,
  myUserID: string,
): boolean {
  const [likeDoc] = useDocument(
    doc(getResponseLikesRef(lobby.id, turn.id, response.player_uid), myUserID),
  );
  return likeDoc?.exists() ?? false;
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

/** Returns true when response is revealed on-screen. */
export function useResponseReveal(response: PlayerResponse) {
  const [alreadyRevealed] = useState(response.isRevealed);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!alreadyRevealed && response.isRevealed) {
      setRevealed(true);
    }
  }, [alreadyRevealed, response.isRevealed]);
  return revealed;
}
