import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { playerResponseConverter } from '../../shared/firestore-converters';
import { RNG } from '../../shared/rng';
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PlayerResponse,
  ResponseCardInGame,
} from '../../shared/types';
import { getTurnRef } from './turn-repository';

///////////////////////////////////////////////////////////////////////////////
//
//  Respository & API for players' responses.
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference of player responses in turn. */
export function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  const turnRef = getTurnRef(lobbyID, turnID);
  return collection(turnRef, 'player_responses').withConverter(
    playerResponseConverter,
  );
}

/** Submit player's response */
export async function submitPlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  player: PlayerInLobby,
  cards: ResponseCardInGame[],
) {
  const rng = RNG.fromTimestamp();
  const response = new PlayerResponse(
    player.uid,
    player.name,
    cards,
    rng.randomInt(),
    0,
    0,
  );
  await setDoc(
    doc(getPlayerResponsesRef(lobby.id, turn.id), player.uid),
    response,
  );
}

/** Retract player's response */
export async function cancelPlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  player: PlayerInLobby,
) {
  await deleteDoc(doc(getPlayerResponsesRef(lobby.id, turn.id), player.uid));
}

/** Called by the judge when revealing a response. */
export async function revealPlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  playerID: string,
) {
  const responseRef = doc(getPlayerResponsesRef(lobby.id, turn.id), playerID);
  await updateDoc(responseRef, { reveal_count: increment(1) });
}

/** Fetches all responses in this turn. */
export async function getAllPlayerResponses(
  lobbyID: string,
  turnID: string,
  minLikeCount: number = 0,
): Promise<Array<PlayerResponse>> {
  const ref = getPlayerResponsesRef(lobbyID, turnID);
  if (minLikeCount <= 0) {
    return (await getDocs(ref)).docs.map((d) => d.data());
  } else {
    return (
      await getDocs(query(ref, where('like_count', '>=', minLikeCount)))
    ).docs.map((d) => d.data());
  }
}
