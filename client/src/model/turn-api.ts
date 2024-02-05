// Client APIs for game turns, when the game is in progress.

import {
  FirestoreError,
  QuerySnapshot,
  collection, deleteDoc, doc,
  getCountFromServer,
  getDoc,
  getDocs, increment, limit, orderBy,
  query, runTransaction, setDoc, updateDoc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  useCollection,
  useCollectionData,
  useCollectionDataOnce,
  useDocumentData
} from "react-firebase-hooks/firestore";
import { db, lobbiesRef, newTurnFun } from "../firebase";
import {
  playerDataConverter,
  playerResponseConverter,
  promptCardInGameConverter,
  responseCardInGameConverter,
  turnConverter,
  voteConverter
} from "../shared/firestore-converters";
import { RNG } from "../shared/rng";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame,
  Vote,
  VoteChoice
} from "../shared/types";

/** Returns Firestore subcollection reference of turns in lobby. */
function getTurnsRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, "turns")
    .withConverter(turnConverter);
}

/** Returns Firestore subcollection reference. */
function getTurnPromptsRef(lobbyID: string, turnID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "prompts")
    .withConverter(promptCardInGameConverter);
}

/** Returns Firestore subcollection reference of remaining prompts in deck. */
function getDeckPromptsRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, "deck_prompts")
    .withConverter(promptCardInGameConverter);
}

/** Returns Firestore subcollection reference of player responses in turn. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "player_responses")
    .withConverter(playerResponseConverter);
}

/** Returns Firestore subcollection reference of player responses in turn. */
function getPlayerHandRef(lobbyID: string, turnID: string, userID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "player_data", userID, "hand")
    .withConverter(responseCardInGameConverter);
}

/** Returns Firestore subcollection reference of player's discarded cards in turn. */
function getPlayerDiscardRef(lobbyID: string, turnID: string, userID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "player_data", userID, "discarded")
    .withConverter(responseCardInGameConverter);
}

/** Returns Firestore subcollection reference of likes for a player response in turn. */
function getResponseLikesRef(lobbyID: string, turnID: string, userID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "player_responses", userID, "likes")
    .withConverter(voteConverter);
}

/** Returns Firestore subcollection reference of votes for a prompt in turn. */
function getPromptVotesRef(lobbyID: string, turnID: string, promptCardID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "prompts", promptCardID, "votes")
    .withConverter(voteConverter);
}

/** Get all likes on this response. */
export async function getResponseLikes(
  lobbyID: string, turnID: string, userID: string): Promise<Vote[]> {
  return (await getDocs(getResponseLikesRef(lobbyID, turnID, userID)))
    .docs.map((d) => d.data());
}

/** How many likes this response has. */
export async function getResponseLikeCount(
  lobbyID: string, turnID: string, userID: string): Promise<number> {
  return (await getCountFromServer(getResponseLikesRef(lobbyID, turnID, userID))).data().count;
}

/** Updates Firestore document with this turn data.
 * Doesn't update subcollections! */
async function updateTurn(lobbyID: string, turn: GameTurn): Promise<void> {
  await setDoc(doc(getTurnsRef(lobbyID), turn.id), turn);
}

/** Updates Firestore document with this turn data.
 * Doesn't update subcollections! */
async function updateHandCard(
  lobbyID: string, turnID: string, userID: string, card: ResponseCardInGame,
) {
  await setDoc(doc(getPlayerHandRef(lobbyID, turnID, userID), card.id), card);
}

/** Fetches all turns that occurred in the lobby. */
export async function getAllTurns(lobbyID: string): Promise<Array<GameTurn>> {
  return (await getDocs(getTurnsRef(lobbyID))).docs.map((d) => d.data());
}

/**
 * Finds the last turn in the lobby.
 * On the client side, it should alway be non-null.
 */
export async function getLastTurn(lobbyID: string): Promise<GameTurn | null> {
  const turns = (await getDocs(query(
    getTurnsRef(lobbyID),
    orderBy("time_created", "desc"),
    limit(1)))
  ).docs.map((d) => d.data());
  if (turns.length === 0) return null;
  return turns[0];
}

/** Get the played prompt for the current turn. */
export async function getTurnPrompt(lobbyID: string, turn: GameTurn):
  Promise<PromptCardInGame | null> {
  // Check legacy prompt:
  if (turn.legacy_prompt) return turn.legacy_prompt;
  // Get the first prompt from the subcollection:
  const promptDocs = (await getDocs(getTurnPromptsRef(lobbyID, turn.id))).docs;
  if (promptDocs.length === 0) return null;
  return promptDocs[0].data();
}

/** Selects a new random prompt from the remaining deck.
 * If no more prompts in deck, returns null. */
export async function pickNewPrompt(lobby: GameLobby): Promise<PromptCardInGame | null> {
  const prompts = (await getDocs(query(
    getDeckPromptsRef(lobby.id), orderBy("random_index", "desc"), limit(1)))
  ).docs.map((d) => d.data());
  if (prompts.length === 0) return null;
  return prompts[0];
}

/** Removes this prompt card from the deck without playing it. */
export async function discardPrompt(lobby: GameLobby, card: PromptCardInGame) {
  await deleteDoc(doc(getDeckPromptsRef(lobby.id), card.id));
}

/** Sets the given card as the prompt of the turn.
 * Also removes the prompt from the deck, so it can't be played again. */
export async function playPrompt(
  lobby: GameLobby, turn: GameTurn, card: PromptCardInGame) {
  if (turn.phase !== "new") {
    throw new Error(`Invalid turn phase to play prompt: ${turn.phase}`);
  }
  await discardPrompt(lobby, card);
  await setDoc(doc(getTurnPromptsRef(lobby.id, turn.id), card.id), card);
  turn.phase = "answering";
  await updateTurn(lobby.id, turn);
}

/** Proceeds turn to reading phase. */
export async function startReadingPhase(lobby: GameLobby, turn: GameTurn) {
  if (turn.phase !== "answering") {
    throw new Error(`Invalid turn phase to play prompt: ${turn.phase}`);
  }
  turn.phase = "reading";
  await updateTurn(lobby.id, turn);
}

/** Begins a new turn. */
export async function startNewTurn(lobby: GameLobby) {
  await newTurnFun({ lobby_id: lobby.id });
}

/** How many prompts remain in the deck */
export async function getPromptCount(lobby: GameLobby): Promise<number> {
  return (await getCountFromServer(getDeckPromptsRef(lobby.id))).data().count;
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
    player.uid, player.name, cards, rng.randomInt(), 0, 0);
  await setDoc(
    doc(getPlayerResponsesRef(lobby.id, turn.id), player.uid), response);
}

/** Retract player's response */
export async function cancelPlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  player: PlayerInLobby,
) {
  await deleteDoc(
    doc(getPlayerResponsesRef(lobby.id, turn.id), player.uid));
}

/** Called by the judge when revealing a response. */
export async function revealPlayerResponse(
  lobby: GameLobby, turn: GameTurn, playerID: string,
) {
  const responseRef = doc(getPlayerResponsesRef(lobby.id, turn.id), playerID);
  await updateDoc(responseRef, { reveal_count: increment(1) });
}

/** Fetches all responses in this turn. */
export async function getAllPlayerResponses(lobbyID: string, turnID: string):
  Promise<Array<PlayerResponse>> {
  return (await getDocs(getPlayerResponsesRef(lobbyID, turnID)))
    .docs.map((d) => d.data());
}

/**
 * Set winner of the current turn and set it to "complete".
 * Also awards "audience choice award" to responses with the most likes
 */
export async function chooseWinner(
  lobby: GameLobby, turn: GameTurn, winnerID: string,
) {
  turn.winner_uid = winnerID;
  await selectAudienceAwardWinners(lobby.id, turn);
  turn.phase = "complete";
  await updateTurn(lobby.id, turn);
}

/** Reassign turn "judge" to a different user */
export async function setTurnJudge(lobby: GameLobby, turn: GameTurn, userID: string) {
  turn.judge_uid = userID;
  await updateTurn(lobby.id, turn);
}

/** Set card as downvoted. This will be copied to all following turns,
 * and recorded at the end of the game. */
export async function toggleDownvoteCard(
  lobby: GameLobby, turn: GameTurn, userID: string, card: ResponseCardInGame,
  downvoted: boolean,
) {
  card.downvoted = downvoted;
  await updateHandCard(lobby.id, turn.id, userID, card);
}

/** Set cards as discarded. When the next turn begins, these cards will be
 * removed from the player's hand, and their final score will decrease by 1. */
export async function discardCards(
  lobby: GameLobby, turn: GameTurn, userID: string, cards: ResponseCardInGame[],
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

/** Create/delete a "yes"/"no" vote for the given prompt from the current player.
 * "Yes" means like, "no" means dislike, null removes vote. */
export async function votePrompt(
  lobby: GameLobby, turn: GameTurn, prompt: PromptCardInGame,
  currentPlayer: PlayerInLobby, choice?: VoteChoice,
) {
  const votesRef = getPromptVotesRef(lobby.id, turn.id, prompt.id);
  const userVoteRef = doc(votesRef, currentPlayer.uid);
  const userVoteSnap = await getDoc(userVoteRef);
  if (choice) {
    await setDoc(userVoteRef, new Vote(currentPlayer.uid, currentPlayer.name, choice));
  } else {
    if (userVoteSnap.exists()) {
      await deleteDoc(userVoteRef);
    }
  }
}

/** Create/delete a "like" for the given response from the current player */
export async function toggleLikeResponse(
  lobby: GameLobby, turn: GameTurn, response: PlayerResponse,
  allResponses: PlayerResponse[], currentPlayer: PlayerInLobby,
) {
  const likesRef = getResponseLikesRef(lobby.id, turn.id, response.player_uid);
  const userLikeRef = doc(likesRef, currentPlayer.uid);
  const userLikeExists = (await getDoc(userLikeRef)).exists();

  if (lobby.settings.likes_limit === "1_pp_per_turn") {
    // Ensure only 1 like per person, delete all other likes:
    await deleteAllUserLikes(lobby, turn, allResponses, currentPlayer.uid);
  } else if (userLikeExists) {
    await deleteDoc(userLikeRef);
  }

  if (!userLikeExists) {
    await setDoc(userLikeRef, new Vote(currentPlayer.uid, currentPlayer.name, "yes"));
  }
}

/** Delete all likes this user gave to other responses */
async function deleteAllUserLikes(
  lobby: GameLobby, turn: GameTurn, responses: PlayerResponse[], userID: string,
) {
  for (const r of responses) {
    const likesRef = getResponseLikesRef(lobby.id, turn.id, r.player_uid);
    const userLikeRef = doc(likesRef, userID);
    if ((await getDoc(userLikeRef)).exists()) {
      await deleteDoc(userLikeRef);
    }
  }
}

/** Choose responses with the most likes and add them to audience_award_uids */
async function selectAudienceAwardWinners(lobbyID: string, turn: GameTurn) {
  // Played cards:
  const responses = await getAllPlayerResponses(lobbyID, turn.id);
  if (responses.length === 0) return;
  let maxLikes = -1;
  let audienceWinners = Array<string>();
  for (const resp of responses) {
    const likeCount = await getResponseLikeCount(lobbyID, turn.id, resp.player_uid);
    if (likeCount == maxLikes) {
      audienceWinners.push(resp.player_uid);
    } else if (likeCount > 0 && likeCount > maxLikes) {
      audienceWinners = [resp.player_uid];
      maxLikes = likeCount;
    }
  }
  turn.audience_award_uids = audienceWinners;
}


type LastTurnHook = [
  lastTurn: GameTurn | null,
  loading: boolean,
  error: any,
]

/** Returns and subscribes to the current turn in the lobby. */
export function useLastTurn(lobbyID: string): LastTurnHook {
  const [lastTurn, setLastTurn] = useState<GameTurn | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [turnsSnap] = useCollection(getTurnsRef(lobbyID));
  useEffect(() => {
    setLoading(true);
    getLastTurn(lobbyID).then((turn) => {
      setLastTurn(turn);
      setLoading(false);
    }).catch((e) => {
      setError(e);
      setLoading(false);
    });
  }, [lobbyID, turnsSnap]);
  return [lastTurn, loading, error];
}

type FirestoreCollectionDataHook<T> = [
  value: T[] | undefined,
  loading: boolean,
  error?: FirestoreError,
  snapshot?: QuerySnapshot<T>,
];

/** Returns and subscribes to all turns in the lobby. */
export function useAllTurns(lobby: GameLobby) {
  return useCollectionData(collection(lobbiesRef, lobby.id, "turns")
    .withConverter(turnConverter));
}

/** Returns to all turns in the lobby. */
export function useAllTurnsOnce(lobby: GameLobby) {
  return useCollectionDataOnce(collection(lobbiesRef, lobby.id, "turns")
    .withConverter(turnConverter));
}

/** Returns and subscribes to current user's player data in the current turn
 * in the lobby. */
export function usePlayerData(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useDocumentData(
    doc(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID)
      .withConverter(playerDataConverter));
}

/** Returns and subscribes to all users's player data in the current turn
 * in the lobby. */
export function useAllPlayerData(lobby: GameLobby, turn: GameTurn) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data")
      .withConverter(playerDataConverter));
}

/** Returns all users's player data in the current turn in the lobby. */
export function useAllPlayerDataOnce(lobby: GameLobby, turn: GameTurn) {
  return useCollectionDataOnce(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data")
      .withConverter(playerDataConverter));
}

/** Returns and subscribes to current user's player hand in the current turn
 * in the lobby. */
export function usePlayerHand(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID, "hand")
      .withConverter(responseCardInGameConverter));
}

/** Returns to current user's player hand in the current turn in the lobby. */
export function usePlayerHandOnce(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useCollectionDataOnce(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID, "hand")
      .withConverter(responseCardInGameConverter));
}

/** Returns and subscribes to current user's player response that they played
 * in the current turn in the lobby. */
export function usePlayerResponse(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useDocumentData(
    doc(lobbiesRef, lobby.id, "turns", turn.id, "player_responses", userID)
      .withConverter(playerResponseConverter));
}

/** Returns and subscribes to all players responses that they played
 * in the current turn in the lobby. */
export function useAllPlayerResponses(lobby: GameLobby, turn: GameTurn) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_responses")
      .withConverter(playerResponseConverter));
}

/** Returns to all players responses that they played
 * in the current turn in the lobby. */
export function useAllPlayerResponsesOnce(lobby: GameLobby, turn: GameTurn) {
  return useCollectionDataOnce(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_responses")
      .withConverter(playerResponseConverter));
}

/** Returns and subscribes to current user's player discarded cards
 * in the current turn in the lobby. */
export function usePlayerDiscard(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID, "discarded")
      .withConverter(responseCardInGameConverter));
}

/** Returns and subscribes to the likes on the given player's response
 * in the current turn in the lobby. */
export function useResponseLikes(lobby: GameLobby, turn: GameTurn, response: PlayerResponse) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_responses", response.player_uid, "likes")
      .withConverter(voteConverter));
}

/** Returns and subscribes to the prompt in the current turn in the lobby. */
export function useAllTurnPrompts(lobby: GameLobby, turn: GameTurn):
  FirestoreCollectionDataHook<PromptCardInGame> {
  const promptsHook = useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "prompts")
      .withConverter(promptCardInGameConverter));
  // Check legacy prompt:
  if (turn.legacy_prompt) return [[turn.legacy_prompt], false];
  else return promptsHook;
}

/** Returns and subscribes to the votes on the given prompt card
 * in the current turn in the lobby. */
export function usePromptVotes(lobby: GameLobby, turn: GameTurn, prompt: PromptCardInGame) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "prompts", prompt.id, "votes")
      .withConverter(voteConverter));
}
