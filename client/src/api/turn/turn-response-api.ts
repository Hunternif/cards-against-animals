import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { RNG } from "../../shared/rng";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PlayerResponse,
  ResponseCardInGame,
} from "../../shared/types";
import { getTurnRef } from "./turn-repository";
import { playerResponseConverter } from "../../shared/firestore-converters";

///////////////////////////////////////////////////////////////////////////////
//
//  Respository & API for players' responses.
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference of player responses in turn. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  const turnRef = getTurnRef(lobbyID, turnID);
  return collection(turnRef, "player_responses").withConverter(
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
): Promise<Array<PlayerResponse>> {
  return (await getDocs(getPlayerResponsesRef(lobbyID, turnID))).docs.map((d) =>
    d.data(),
  );
}
