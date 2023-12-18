import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";

// This import is copied during build
import firebaseConfig from "./firebase-config.json";
import {
  assertLobbyCreator,
  assertLoggedIn,
  assertPlayerInLobby
} from "./model/auth-api";
import {
  addPlayer,
  copyDecksToLobby,
  createLobby,
  findActiveLobbyWithPlayer,
  getLobby,
  updateLobby
} from "./model/lobby-server-api";
import {
  createNewTurn,
  getLastTurn,
  updateTurn
} from "./model/turn-server-api";
import { CardInGame, PromptCardInGame, ResponseCardInGame } from "./shared/types";
import { logCardView } from "./model/deck-server-api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobby = onCall<
  { creator_uid: string }, Promise<{ lobby_id: string }>
>(
  { region: firebaseConfig.region, maxInstances: 2 },
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
  { region: firebaseConfig.region, maxInstances: 2 },
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
  { region: firebaseConfig.region, maxInstances: 2 },
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
  { region: firebaseConfig.region, maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    assertLobbyCreator(event, lobby);
    // Copy cards from all added decks into the lobby:
    await copyDecksToLobby(lobby);
    await createNewTurn(lobby.id);
    // Start the game:
    lobby.status = "in_progress";
    await updateLobby(lobby);
    logger.info(`Started lobby ${lobby.id}`);
  }
);

/** Begins new turn. */
export const newTurn = onCall<
  { lobby_id: string }, Promise<void>
>(
  { region: firebaseConfig.region, maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    await assertPlayerInLobby(event, lobby.id);
    const lastTurn = await getLastTurn(lobby.id);
    if (lastTurn && lastTurn.phase != "complete") {
      throw new HttpsError("failed-precondition", "Last turn is not complete");
    }
    await createNewTurn(lobby.id);
    logger.info(`Started new turn in lobby ${lobby.id}`);
  }
);

/** Ends current turn and sets lobby status to "ended". */
export const endLobby = onCall<
  { lobby_id: string }, Promise<void>
>(
  { region: firebaseConfig.region, maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    const lastTurn = await getLastTurn(lobby.id);
    if (!lastTurn) {
      assertLobbyCreator(event, lobby);
    } else {
      if (lastTurn.judge_uid !== event.auth?.uid) {
        throw new HttpsError("unauthenticated", "Must be lobby judge");
      }
      // End last turn:
      lastTurn.phase = "complete";
      await updateTurn(lobby.id, lastTurn);
    }
    // End lobby:
    lobby.status = "ended";
    await updateLobby(lobby);
    logger.info(`Ended lobby ${lobby.id}`);
  }
);

/**
 * Logs impression on a set of cards, when they were viewed for the first time
 * by a player in a lobby.
 * - Prompt impression should be logged only the "judege" who picked it.
 * - Response impression should be logged only by the player who was dealt it.
 */
export const logImpression = onCall<
  {
    lobby_id: string,
    prompt: PromptCardInGame,
    responses: ResponseCardInGame[],
  }, Promise<void>
>(
  { region: firebaseConfig.region, maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    await assertPlayerInLobby(event, event.data.lobby_id);
    await logCardView([event.data.prompt], event.data.responses);
    logger.info(`Logged impression of ${event.data.responses.length + 1} cards`);
  }
);