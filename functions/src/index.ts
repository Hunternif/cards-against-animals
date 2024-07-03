import { setGlobalOptions } from 'firebase-functions/v2/options';

import { exportCallable } from './functions/function-utils';
import { endLobbyHandler } from './functions/lobby/endLobby';
import { findOrCreateLobbyHandler } from './functions/lobby/findOrCreateLobby';
import { findOrCreateLobbyAndJoinHandler } from './functions/lobby/findOrCreateLobbyAndJoin';
import { joinLobbyHandler } from './functions/lobby/joinLobby';
import { kickPlayerHandler } from './functions/lobby/kickPlayer';
import { startLobbyHandler } from './functions/lobby/startLobby';
import { updateLobbySettingsHandler } from './functions/lobby/updateLobbySettings';
import { discardNowHandler } from './functions/turn/discardNow';
import { logInteractionHandler } from './functions/turn/logInteraction';
import { newTurnHandler } from './functions/turn/newTurn';
import { createOnLobbyStatusChangeHandler } from './triggers/onLobbyStatusChange';
import { createOnPlayerStatusChangeHandler } from './triggers/onPlayerStatusChange';
import { createOnTurnPhaseChangeHandler } from './triggers/onTurnPhaseChange';

// This import is copied during build
import firebaseConfig from './firebase-config.json';
import { createOnUserPresenceChangeHandler } from './triggers/onUserPresenceChange';
import { lockDeckHandler } from './functions/deck/lockDeck';
import { unlockDeckForUserHandler } from './functions/deck/unlockDeckForUser';

setGlobalOptions({
  region: firebaseConfig.region,
});

/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobby = exportCallable(findOrCreateLobbyHandler);

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export const joinLobby = exportCallable(joinLobbyHandler);

/** Combines `findOrCreateLobby` and `joinLobby` */
export const findOrCreateLobbyAndJoin = exportCallable(
  findOrCreateLobbyAndJoinHandler,
);

/** Completes lobby setup and starts the game. */
export const startLobby = exportCallable(startLobbyHandler);

/** Updates lobby settings. Allowed for creator and current judge. */
export const updateLobbySettings = exportCallable(updateLobbySettingsHandler);

/** Kicks player from the game. Allowed for creator and current judge. */
export const kickPlayer = exportCallable(kickPlayerHandler);

/** Begins new turn. Current turn id ensures idempotency. */
export const newTurn = exportCallable(newTurnHandler);

/**
 * Ends current turn and sets lobby status to "ended".
 * This needs to be a cloud function to perform additional permission checks.
 */
export const endLobby = exportCallable(endLobbyHandler);

/**
 * Logs impression on a set of cards, when they were viewed for the first time
 * by a player in a lobby, and when they are played.
 * - Prompt impression should be logged only the "judge" who picked it.
 * - Response impression should be logged only by the player who was dealt it.
 *   Response impression can be logged once per turn, so that unplayed cards
 *   will accumulate more views over multiple turns.
 */
export const logInteraction = exportCallable(logInteractionHandler);

/**
 * Immediately remove discarded cards from the player's hand,
 * and deal new cards.
 */
export const discardNow = exportCallable(discardNowHandler);

/** Locks deck with a password. */
export const lockDeck = exportCallable(lockDeckHandler);

/** Unlocks the deck for this user, given the password. */
export const unlockDeckForUser = exportCallable(unlockDeckForUserHandler);

/** Logic to run after each turn phase. */
export const onTurnPhaseChange = createOnTurnPhaseChangeHandler();

/** Clean-up logic to run when a player changes their status. */
export const onPlayerStatusChange = createOnPlayerStatusChangeHandler();

/** Logic to run after lobby status changes. */
export const onLobbyStatusChange = createOnLobbyStatusChangeHandler();

/** Monitors user presence. */
export const onUserPresenceChange = createOnUserPresenceChangeHandler();