// APIs for when the game as started.

import { db } from "../firebase-server";
import { GameTurn, PromptCardInGame } from "../shared/types";
import { turnConverter } from "./firebase-converters";

/** Returns Firestore subcollection reference. */
function getTurnsRef(lobbyID: string) {
  return db.collection(`lobbies/${lobbyID}/turns`).withConverter(turnConverter);
}

/** Returns all turns that occurred in this lobby. */
export async function getAllTurns(lobbyID: string): Promise<Array<GameTurn>> {
  return (await getTurnsRef(lobbyID).get()).docs.map((t) => t.data());
}

/** Finds the last turn in the lobby. */
export async function getLastTurn(lobbyID: string): Promise<GameTurn | null> {
  const docs = (await getTurnsRef(lobbyID)
    .orderBy("time_created", "desc")
    .limit(1).get()
  ).docs;
  if (docs.length === 0) return null;
  return docs[0].data();
}

/** Counts how many turns have occurred in this lobby. */
export async function countTurns(lobbyID: string): Promise<number> {
  return (await getTurnsRef(lobbyID).count().get()).data().count;
}

/**
 * Starts a new turn and returns it.
 */
export async function startNewTurn(lobbyID: string): Promise<GameTurn> {
  const lastTurn = await getLastTurn(lobbyID);
  if (lastTurn && lastTurn.phase != "complete") {
    throw new Error(`Last turn has not completed in lobby ${lobbyID}`);
  }
  const judge = await selectJudge(lobbyID);
  const prompt = await selectPrompt(lobbyID);
  const id = String(await countTurns(lobbyID) + 1);
  const newTurn = new GameTurn(id, judge, prompt);
  await getTurnsRef(lobbyID).doc(id).set(newTurn);
  await dealCards(newTurn, lobbyID);
  return newTurn; // timestamp may not have reloaded but that's ok.
}

/** Returns UID of the player who will judge the next turn, */
async function selectJudge(lobbyID: string):
  Promise<string> {
  //TODO
}

/** Selects a new prompt card from the remaining deck. */
async function selectPrompt(lobbyID: string): Promise<PromptCardInGame> {
  // TODO
}

/** Deal cards to the players. */
async function dealCards(turn: GameTurn, lobbyID: string): Promise<void> {
  // TODO
}
