import * as logger from "firebase-functions/logger";
import {
  onDocumentUpdated
} from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";

// This import is copied during build
import firebaseConfig from "./firebase-config.json";
import {
  assertLobbyControl,
  assertLobbyCreator,
  assertLoggedIn,
  assertPlayerInLobby
} from "./model/auth-api";
import { logCardInteractions, logDownvotes } from "./model/deck-server-api";
import {
  addPlayer,
  cleanUpEndedLobby,
  cleanUpPlayer,
  createLobby,
  findActiveLobbyWithPlayer,
  getLobby,
  getPlayer,
  setLobbyEnded,
  startLobbyInternal,
  updateLobby,
  updatePlayer
} from "./model/lobby-server-api";
import {
  createNewTurn,
  discardNowAndDealCardsToPlayer,
  getAllPlayerResponses,
  getLastTurn,
  logInteractionsInCompletePhase,
  logInteractionsInReadingPhase,
  logPlayedPrompt,
  updatePlayerScoresFromTurn,
  updateTurn
} from "./model/turn-server-api";
import { setUsersCurrentLobby } from "./model/user-server-api";
import { lobbyConverter, playerConverter, turnConverter } from "./shared/firestore-converters";
import { KickAction, LobbySettings, PromptCardInGame, ResponseCardInGame } from "./shared/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

setGlobalOptions({
  region: firebaseConfig.region,
});

/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobby = onCall<
  { creator_uid: string }, Promise<{ lobby_id: string }>
>(
  { maxInstances: 2 },
  async (event) => {
    // await sleep(2000);
    assertLoggedIn(event);
    const creatorUID = event.data.creator_uid;
    // Find current active lobby for this user:
    const foundLobby = await findActiveLobbyWithPlayer(creatorUID);
    if (foundLobby) {
      return { lobby_id: foundLobby.id };
    }
    // Create a new lobby:
    const newLobby = await createLobby(creatorUID);
    return { lobby_id: newLobby.id };
  }
);

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export const joinLobby = onCall<
  { user_id: string, lobby_id: string }, Promise<void>
>(
  { maxInstances: 2 },
  async (event) => {
    // await sleep(2000);
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    await addPlayer(lobby, event.data.user_id);
  }
);

/** Combines `findOrCreateLobby` and `joinLobby` */
export const findOrCreateLobbyAndJoin = onCall<
  { user_id: string }, Promise<{ lobby_id: string }>
>(
  { maxInstances: 2 },
  async (event) => {
    // await sleep(2000);
    assertLoggedIn(event);
    const userID = event.data.user_id;
    const lobby = await findActiveLobbyWithPlayer(userID) ??
      (await createLobby(userID));
    await addPlayer(lobby, userID);
    return { lobby_id: lobby.id };
  }
);

/** Completes lobby setup and starts the game. */
export const startLobby = onCall<
  { lobby_id: string }, Promise<void>
>(
  { maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    assertLobbyCreator(event, lobby);
    await startLobbyInternal(lobby);
  }
);

/** Updates lobby settings. Allowed for creator and current judge. */
export const updateLobbySettings = onCall<
  { lobby_id: string, settings: LobbySettings }, Promise<void>
>(
  { maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    await assertLobbyControl(event, lobby);
    lobby.settings = event.data.settings;
    await updateLobby(lobby);
    logger.info(`Updated settings for lobby ${lobby.id}`);
  }
);

/** Kicks player from the game. Allowed for creator and current judge. */
export const kickPlayer = onCall<
  { lobby_id: string, user_id: string, action: KickAction }, Promise<void>
>(
  { maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    await assertLobbyControl(event, lobby);
    const player = await getPlayer(lobby.id, event.data.user_id);
    if (player) {
      switch (event.data.action) {
        case "kick":
          player.status = "left";
          await updatePlayer(lobby.id, player);
          logger.info(`Soft-kicked player ${player.uid} from ${lobby.id}`);
          break;
        case "ban":
          player.role = "spectator";
          player.status = "banned";
          await updatePlayer(lobby.id, player);
          logger.info(`Hard-banned player ${player.uid} from ${lobby.id}`);
          break;
      }
    }
  }
);

/** Begins new turn. Current turn id ensures idempotency. */
export const newTurn = onCall<
  { lobby_id: string, current_turn_id: string }, Promise<void>
>(
  { maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    await assertPlayerInLobby(event, lobby.id);
    // Allow players to start a new turn whenever:
    // const lastTurn = await getLastTurn(lobby.id);
    // if (lastTurn && lastTurn.phase != "complete") {
    //   throw new HttpsError("failed-precondition", "Last turn is not complete");
    // }
    // Ensure current turn is the same:
    if (lobby.current_turn_id !== event.data.current_turn_id) {
      logger.warn(`Attempt to start new turn at the wrong time in lobby ${lobby.id}`);
    } else {
      await createNewTurn(lobby);
      logger.info(`Started new turn in lobby ${lobby.id}`);
    }
  }
);

/**
 * Ends current turn and sets lobby status to "ended".
 * This needs to be a cloud function to perform additional permission checks.
 */
export const endLobby = onCall<
  { lobby_id: string }, Promise<void>
>(
  { maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    await assertLobbyControl(event, lobby);
    await setLobbyEnded(lobby);
  }
);

/**
 * Logs impression on a set of cards, when they were viewed for the first time
 * by a player in a lobby, and when they are played.
 * - Prompt impression should be logged only the "judege" who picked it.
 * - Response impression should be logged only by the player who was dealt it.
 *   Response impression can be logged once per turn, so that unplayed cards
 *   will accumulate more views over multiple turns.
 */
export const logInteraction = onCall<
  {
    lobby_id: string,
    viewed_prompts: PromptCardInGame[],
    viewed_responses: ResponseCardInGame[],
    played_prompts: PromptCardInGame[],
    played_responses: ResponseCardInGame[],
    discarded_prompts: PromptCardInGame[],
    discarded_responses: ResponseCardInGame[],
    won_responses: ResponseCardInGame[],
  }, Promise<void>
>(
  { maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    await assertPlayerInLobby(event, event.data.lobby_id);
    const lobby = await getLobby(event.data.lobby_id);
    await logCardInteractions(lobby, {
      viewedPrompts: event.data.viewed_prompts,
      viewedResponses: event.data.viewed_responses,
      playedPrompts: event.data.played_prompts,
      playedResponses: event.data.played_responses,
      discardedPrompts: event.data.discarded_prompts,
      discardedResponses: event.data.discarded_responses,
      wonResponses: event.data.won_responses,
    });
    const total =
      event.data.viewed_prompts.length +
      event.data.played_prompts.length +
      event.data.viewed_responses.length +
      event.data.played_responses.length;
    logger.info(`Logged ${total} interactions`);
  }
);

/**
 * Immediately remove discarded cards from the player's hand,
 * and deal new cards.
 */
export const discardNow = onCall<
  { lobby_id: string }, Promise<void>
>(
  { maxInstances: 2 },
  async (event) => {
    const userID = assertLoggedIn(event);
    await assertPlayerInLobby(event, event.data.lobby_id);
    const lobby = await getLobby(event.data.lobby_id);
    const turn = await getLastTurn(lobby);
    if (turn) {
      await discardNowAndDealCardsToPlayer(lobby, turn, userID);
    }
  }
);

/** Logic to run after each turn phase. */
export const onTurnPhaseChange = onDocumentUpdated(
  "lobbies/{lobbyID}/turns/{turnID}",
  async (event) => {
    if (!event.data) return;
    const lobbyID = event.params.lobbyID;
    const turnBefore = turnConverter.fromFirestore(event.data.before);
    const turnAfter = turnConverter.fromFirestore(event.data.after);
    if (turnBefore.phase !== turnAfter.phase) {
      // Changed phase
      if (turnAfter.phase === "answering") {
        await logPlayedPrompt(lobbyID, turnAfter);
      } else if (turnAfter.phase === "reading") {
        // All responses submitted: log interactions.
        await logInteractionsInReadingPhase(lobbyID, turnAfter);
      } else if (turnAfter.phase === "complete") {
        // Turn completed: update all scores.
        const responses = await getAllPlayerResponses(lobbyID, turnAfter.id);
        await updatePlayerScoresFromTurn(lobbyID, turnAfter, responses);
        await logInteractionsInCompletePhase(lobbyID, turnAfter, responses);
      }
      // Update phase timestamp
      if (turnBefore.phase_start_time.getUTCMilliseconds() ===
        turnAfter.phase_start_time.getUTCMilliseconds()) {
        turnAfter.phase_start_time = new Date();
        await updateTurn(lobbyID, turnAfter);
      }
    }
  }
);

/** Clean-up logic to run when a player changes their status. */
export const onPlayerStatusChange = onDocumentUpdated(
  "lobbies/{lobbyID}/players/{userID}",
  async (event) => {
    if (!event.data) return;
    const lobbyID = event.params.lobbyID;
    const userID = event.params.userID;
    const playerBefore = playerConverter.fromFirestore(event.data.before);
    const playerAfter = playerConverter.fromFirestore(event.data.after);
    if (playerBefore.status !== playerAfter.status) {
      if (playerAfter.status === "left" || playerAfter.status === "banned") {
        await cleanUpPlayer(lobbyID, playerAfter);
      } else if (playerAfter.status === "online") {
        // Player rejoined, update current lobby ID:
        await setUsersCurrentLobby(userID, lobbyID);
        logger.info(`User ${playerAfter.name} (${userID}) is online in lobby ${lobbyID}`);
      }
    }
  }
);

/** Logic to run after lobby status changes. */
export const onLobbyStatusChange = onDocumentUpdated(
  "lobbies/{lobbyID}",
  async (event) => {
    if (!event.data) return;
    const lobbyBefore = lobbyConverter.fromFirestore(event.data.before);
    const lobbyAfter = lobbyConverter.fromFirestore(event.data.after);
    if (lobbyBefore.status !== lobbyAfter.status) {
      if (lobbyAfter.status === "ended") {
        // Cleanup after a lobby ends:
        await cleanUpEndedLobby(lobbyAfter.id);
        // Apply downvotes to the deck:
        await logDownvotes(lobbyAfter.id);
      }
    }
  }
);