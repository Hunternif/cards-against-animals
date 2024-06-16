import { collection, doc, getDocs, runTransaction } from "firebase/firestore";
import { db, discardNowFun } from "../firebase";
import { GameLobby, GameTurn, ResponseCardInGame } from "../shared/types";
import { getTurnRef } from "./turn-repository";
import { responseCardInGameConverter } from "../shared/firestore-converters";

///////////////////////////////////////////////////////////////////////////////
//
//  Repository & API for discarding cards from the player's hand.
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference of player's discarded cards in turn. */
function getPlayerDiscardRef(
  lobbyID: string,
  turnID: string,
  userID: string,
) {
  const turnRef = getTurnRef(lobbyID, turnID);
  return collection(turnRef, "player_data", userID, "discarded")
    .withConverter(responseCardInGameConverter);
}

/** Set cards as discarded. When the next turn begins, these cards will be
 * removed from the player's hand, and their final score will decrease by 1. */
export async function discardCards(
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
  cards: ResponseCardInGame[],
) {
  const discardRef = getPlayerDiscardRef(lobby.id, turn.id, userID);
  const currentDiscard = (await getDocs(discardRef)).docs;
  await runTransaction(db, async (transaction) => {
    // Delete old discard:
    for (const oldDoc of currentDiscard) {
      transaction.delete(doc(discardRef, oldDoc.id));
    }
    for (const card of cards) {
      transaction.set(doc(discardRef, card.id), card);
    }
  });
}

/** Immediately discard cards marked as discarded, and deal new cards. */
export async function discardImmediately(lobby: GameLobby) {
  await discardNowFun({ lobby_id: lobby.id });
}
