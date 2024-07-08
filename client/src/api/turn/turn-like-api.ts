import { collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, setDoc } from "firebase/firestore";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PlayerResponse,
  Vote,
} from "../../shared/types";
import { assertExhaustive } from "../../shared/utils";
import { getTurnRef } from "./turn-repository";
import { voteConverter } from "../../shared/firestore-converters";

///////////////////////////////////////////////////////////////////////////////
//
//  Repository & API for likes on players' responses.
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference of likes for a player response in turn. */
export function getResponseLikesRef(
  lobbyID: string,
  turnID: string,
  userID: string,
) {
  const turnRef = getTurnRef(lobbyID, turnID);
  return collection(turnRef, "player_responses", userID, "likes")
    .withConverter(voteConverter);
}

/** Get all likes on this response. */
export async function getResponseLikes(
  lobbyID: string,
  turnID: string,
  userID: string,
): Promise<Vote[]> {
  return (await getDocs(getResponseLikesRef(lobbyID, turnID, userID))).docs.map(
    (d) => d.data(),
  );
}

/** How many likes this response has. */
export async function getResponseLikeCount(
  lobbyID: string,
  turnID: string,
  userID: string,
): Promise<number> {
  return (
    await getCountFromServer(getResponseLikesRef(lobbyID, turnID, userID))
  ).data().count;
}

/** Create/delete a "like" for the given response from the current player */
export async function toggleLikeResponse(
  lobby: GameLobby,
  turn: GameTurn,
  response: PlayerResponse,
  allResponses: PlayerResponse[],
  currentPlayer: PlayerInLobby,
) {
  const likesRef = getResponseLikesRef(lobby.id, turn.id, response.player_uid);
  const userLikeRef = doc(likesRef, currentPlayer.uid);
  const userLikeExists = (await getDoc(userLikeRef)).exists();

  switch (lobby.settings.likes_limit) {
    case "1_pp_per_turn":
      // Ensure only 1 like per person, delete all other likes:
      await deleteAllUserLikes(lobby, turn, allResponses, currentPlayer.uid);
      break;
    case "none":
      if (userLikeExists) {
        await deleteDoc(userLikeRef);
      }
      break;
    default:
      assertExhaustive(lobby.settings.likes_limit);
  }

  if (!userLikeExists) {
    await setDoc(
      userLikeRef,
      new Vote(currentPlayer.uid, currentPlayer.name, "yes"),
    );
  }
}

/** Delete all likes this user gave to other responses */
async function deleteAllUserLikes(
  lobby: GameLobby,
  turn: GameTurn,
  responses: PlayerResponse[],
  userID: string,
) {
  for (const r of responses) {
    const likesRef = getResponseLikesRef(lobby.id, turn.id, r.player_uid);
    const userLikeRef = doc(likesRef, userID);
    if ((await getDoc(userLikeRef)).exists()) {
      await deleteDoc(userLikeRef);
    }
  }
}
