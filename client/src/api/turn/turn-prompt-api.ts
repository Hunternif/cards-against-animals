import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { firestore } from "../../firebase";
import { promptCardInGameConverter, responseCardInGameConverter } from "../../shared/firestore-converters";
import { GameLobby, GameTurn, PromptCardInGame } from "../../shared/types";
import { lobbiesRef } from "../lobby/lobby-repository";
import { getTurnRef, updateTurn } from "./turn-repository";

///////////////////////////////////////////////////////////////////////////////
//
//  Repository & API for dealing prompt cards in a game turn.
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference. */
function getTurnPromptsRef(lobbyID: string, turnID: string) {
  const turnRef = getTurnRef(lobbyID, turnID);
  return collection(turnRef, "prompts").withConverter(
    promptCardInGameConverter,
  );
}

/** Returns Firestore subcollection reference of remaining prompts in deck. */
function getDeckPromptsRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, "deck_prompts").withConverter(
    promptCardInGameConverter,
  );
}

/** Returns Firestore subcollection reference of remaining responses in deck. */
function getDeckResponsesRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, "deck_responses").withConverter(
    responseCardInGameConverter,
  );
}

/** Get the played prompt for the current turn. */
export async function getTurnPrompt(
  lobbyID: string,
  turn: GameTurn,
): Promise<PromptCardInGame | null> {
  // Check legacy prompt:
  if (turn.legacy_prompt) return turn.legacy_prompt;
  // Get the first prompt from the subcollection:
  const promptDocs = (await getDocs(getTurnPromptsRef(lobbyID, turn.id))).docs;
  if (promptDocs.length === 0) return null;
  return promptDocs[0].data();
}

/** Selects a new random prompt from the remaining deck.
 * If no more prompts in deck, returns null. */
export async function pickNewPrompts(
  lobby: GameLobby,
): Promise<PromptCardInGame[]> {
  // TODO: put prompt count in settings
  const prompts = (
    await getDocs(
      query(
        getDeckPromptsRef(lobby.id),
        orderBy("random_index", "desc"),
        limit(3),
      ),
    )
  ).docs.map((d) => d.data());
  if (prompts.length === 0) return [];
  return prompts;
}

/** Sets the given card as the prompt of the turn.
 * Also removes the prompt from the deck, so it can't be played again. */
export async function playPrompt(
  lobby: GameLobby,
  turn: GameTurn,
  card: PromptCardInGame,
) {
  if (turn.phase !== "new") {
    throw new Error(`Invalid turn phase to play prompt: ${turn.phase}`);
  }
  await discardPrompts(lobby, [card]);
  await setDoc(doc(getTurnPromptsRef(lobby.id, turn.id), card.id), card);
  turn.phase = "answering";
  await updateTurn(lobby.id, turn);
}

/** Removes this prompt card from the deck without playing it. */
export async function discardPrompts(
  lobby: GameLobby,
  cards: PromptCardInGame[],
) {
  await runTransaction(firestore, async (transaction) => {
    for (const card of cards) {
      transaction.delete(doc(getDeckPromptsRef(lobby.id), card.id));
    }
  });
}

/** How many prompts remain in the deck */
export async function getPromptCount(lobby: GameLobby): Promise<number> {
  return (await getCountFromServer(getDeckPromptsRef(lobby.id))).data().count;
}

/** How many responses remain in the deck */
export async function getResponseCount(lobby: GameLobby): Promise<number> {
  return (await getCountFromServer(getDeckResponsesRef(lobby.id))).data().count;
}
