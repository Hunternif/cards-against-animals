// APIs for when the game as started.

import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebase-server";
import { GameTurn, PromptCardInGame } from "../shared/types";
import { getRandomInt } from "../shared/utils";
import { promptCardInGameConverter, turnConverter } from "./firebase-converters";
import { getPlayers } from "./lobby-server-api";

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
  const judge = await selectJudge(lastTurn, lobbyID);
  const prompt = await selectPrompt(lobbyID);
  const id = String(await countTurns(lobbyID) + 1);
  const newTurn = new GameTurn(id, judge, prompt);
  await getTurnsRef(lobbyID).doc(id).set(newTurn);
  await dealCards(newTurn, lobbyID);
  return newTurn; // timestamp may not have reloaded but that's ok.
}

/** Returns UID of the player who will judge the next turn, */
async function selectJudge(lastTurn: GameTurn | null, lobbyID: string):
  Promise<string> {
  const sequence = await getPlayerSequence(lobbyID);
  const lastIndex = lastTurn ? sequence.indexOf(lastTurn.judge_uid) : -1;
  if (lastIndex === -1) return sequence[0];
  let nextIndex = lastIndex + 1;
  if (nextIndex >= sequence.length) nextIndex = 0;
  return sequence[nextIndex];
}

/** Selects a new prompt card from the remaining deck. */
async function selectPrompt(lobbyID: string): Promise<PromptCardInGame> {
  const promptsRef = db.collection(`lobbies/${lobbyID}/deck_prompts`)
    .withConverter(promptCardInGameConverter);
  const cards = (await promptsRef
    .orderBy("random_index")
    .limit(1).get()
  ).docs.map((c) => c.data());
  if (cards.length === 0) {
    throw new HttpsError("failed-precondition", "No more cards in deck");
  }
  const selected = cards[0];
  // Remove selected card from the remaining deck:
  await promptsRef.doc(selected.prefixID()).delete();
  return selected;
}

/** Deal cards to the players. */
async function dealCards(turn: GameTurn, lobbyID: string): Promise<void> {
  // TODO
}

/**
 * Returns a sequence of player UIDs.
 * Next judge is selected by rotating it.
 * The sequence must be stable!
 */
async function getPlayerSequence(lobbyID: string): Promise<Array<string>> {
  const players = await getPlayers(lobbyID);
  // filter out spectators, sort them by UIDs
  const uids = players.filter((p) => p.role == "player").map((p) => p.uid);
  return uids.sort();
}
