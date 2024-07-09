import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';
import firebaseConfig from '../firebase-config.json';
import { firestore, lobbiesRef, usersRef } from '../firebase-server';
import {
  promptCardInGameConverter,
  responseCardInGameConverter,
} from '../shared/firestore-converters';
import { RNG } from '../shared/rng';
import {
  GameLobby,
  PlayerInLobby,
  PlayerRole,
  PromptCardInGame,
  ResponseCardInGame,
  defaultLobbySettings,
} from '../shared/types';
import { assertExhaustive } from '../shared/utils';
import { assertNotAnonymous } from './auth-api';
import { verifyUserHasDeckKey } from './deck-lock-server-api';
import {
  getAllPromptsForGame,
  getAllResponsesForGame,
  getDeck,
} from './deck-server-api';
import {
  countPlayers,
  getLobby,
  getOnlinePlayers,
  getPlayer,
  getPlayerThrows,
  getPlayers,
  getPlayersRef,
  updateLobby,
  updatePlayer,
} from './lobby-server-repository';
import { createNewTurn, dealCardsToPlayer } from './turn-server-api';
import { getLastTurn, updateTurn } from './turn-server-repository';
import {
  getCAAUser,
  getOrCreateCAAUser,
  setUsersCurrentLobby,
  updateCAAUser,
} from './user-server-api';

/** Finds current active lobby for this user, returns lobby ID. */
export async function findActiveLobbyWithPlayer(
  userID: string,
): Promise<GameLobby | null> {
  // Current lobby is written in the 'users' collection:
  const caaUser = await getCAAUser(userID);
  if (!caaUser) return null;
  if (caaUser.current_lobby_id) {
    // Verify that lobby exists:
    const lobby = (await lobbiesRef.doc(caaUser.current_lobby_id).get()).data();
    if (lobby && lobby.status != 'ended') return lobby;
    // Lobby doesn't exist, delete the record:
    delete caaUser.current_lobby_id;
    await updateCAAUser(caaUser);
    return null;
  }
  return null;
}

/**
 * Creates a new lobby from this player, returns it.
 * Throws if maximum number of active lobbies is reached.
 */
export async function createLobby(userID: string): Promise<GameLobby> {
  // TODO: need to acquire lock. This doesn't prevent double lobby creation!
  // Only allow non-anonymous users to create lobbies:
  await assertNotAnonymous(userID);
  await assertLobbyLimit();
  const newLobbyRef = lobbiesRef.doc();
  const newID = newLobbyRef.id;
  const newLobby = new GameLobby(newID, userID, defaultLobbySettings(), 'new');
  await newLobbyRef.set(newLobby);
  logger.info(`Created new lobby by user: ${userID}`);
  return newLobby;
}

async function allowJoinAsPlayer(lobby: GameLobby): Promise<boolean> {
  const playerCount = await countPlayers(lobby.id, 'player');
  if (playerCount >= lobby.settings.max_players) return false;
  switch (lobby.status) {
    case 'new':
      return true;
    case 'in_progress':
      return lobby.settings.allow_join_mid_game;
    case 'ended':
      return false;
    default:
      assertExhaustive(lobby.status);
      return false;
  }
}

async function allowJoinAsSpectator(lobby: GameLobby): Promise<boolean> {
  switch (lobby.status) {
    case 'new':
    case 'in_progress':
      return true;
    case 'ended':
      return false;
    default:
      assertExhaustive(lobby.status);
      return false;
  }
}

/**
 * Attempts to add player to lobby as "player",
 * or as "spectator" if the game is already in progress.
 */
export async function addPlayer(
  lobby: GameLobby,
  userID: string,
): Promise<void> {
  const caaUser = await getOrCreateCAAUser(userID);
  // Add player in a transaction so it only happens once:
  const player = await firestore.runTransaction(async (transaction) => {
    const playerRef = getPlayersRef(lobby.id).doc(userID);
    const hasAlreadyJoined = (await transaction.get(playerRef)).exists;
    if (hasAlreadyJoined) {
      await setUsersCurrentLobby(userID, lobby.id);
      logger.warn(
        `User ${caaUser.name} (${userID}) re-joined lobby ${lobby.id}`,
      );
      return null;
    }
    let role: PlayerRole = 'spectator';
    if (lobby.status == 'ended') {
      throw new HttpsError('unavailable', `Lobby already ended: ${lobby.id}`);
    }
    if (await allowJoinAsPlayer(lobby)) {
      role = 'player';
    } else if (await allowJoinAsSpectator(lobby)) {
      role = 'spectator';
    } else {
      throw new HttpsError('unavailable', `Could not join lobby ${lobby.id}`);
    }
    const rng = RNG.fromStrSeedWithTimestamp(lobby.id + caaUser.name);
    const player = new PlayerInLobby(
      userID,
      caaUser.name,
      caaUser.avatar_id,
      rng.randomInt(),
      role,
      'online',
    );
    transaction.set(playerRef, player);
    logger.info(
      `User ${caaUser.name} (${userID}) joined lobby ${lobby.id} as ${role}`,
    );
    return player;
  });

  // Already joined, or some other invalid state:
  if (player == null) return;

  await setUsersCurrentLobby(userID, lobby.id);

  // If the game has started, onboard the player:
  if (lobby.status == 'in_progress' && player.role === 'player') {
    // Deal cards to the new player:
    const turn = await getLastTurn(lobby);
    if (turn) {
      await dealCardsToPlayer(lobby, null, turn, userID);
    } else {
      logger.warn(
        `Could not deal cards. Lobby ${lobby.id} is in progess but has no turns.`,
      );
    }
    // If using turns_per_person, add more turns:
    if (lobby.settings.play_until === 'max_turns_per_person') {
      lobby.settings.max_turns += 1;
      await updateLobby(lobby);
    }
  }
}

/**
 * Will attempt to change player role.
 * Can only become 'player' if player limit is not exceeded.
 */
export async function changePlayerRole(
  lobby: GameLobby,
  userID: string,
  role: PlayerRole,
): Promise<void> {
  const player = await getPlayerThrows(lobby.id, userID);
  switch (role) {
    case 'player':
      if (!(await allowJoinAsPlayer(lobby))) {
        throw new HttpsError('failed-precondition', 'Cannot join as player');
      }
      break;
    case 'spectator':
      if (!(await allowJoinAsSpectator(lobby))) {
        throw new HttpsError('failed-precondition', 'Cannot join as spectator');
      }
      break;
    default:
      assertExhaustive(role);
  }
  player.role = role;
  await updatePlayer(lobby.id, player);

  // If the game has started, onboard the player:
  if (lobby.status == 'in_progress' && player.role === 'player') {
    // Deal cards to the new player:
    const turn = await getLastTurn(lobby);
    if (turn) {
      await dealCardsToPlayer(lobby, null, turn, userID);
    } else {
      logger.warn(
        `Could not deal cards. Lobby ${lobby.id} is in progess but has no turns.`,
      );
    }
    // If using turns_per_person, add more turns:
    if (lobby.settings.play_until === 'max_turns_per_person') {
      lobby.settings.max_turns += 1;
      await updateLobby(lobby);
    }
  }
}

/** Starts the game */
export async function startLobby(lobby: GameLobby) {
  await validateGameSettings(lobby);
  // Copy cards from all added decks into the lobby:
  await copyDecksToLobby(lobby);
  await createNewTurn(lobby);
  // Start the game:
  lobby.status = 'in_progress';
  await updateLobby(lobby);
  logger.info(`Started lobby ${lobby.id}`);
}

/** Check and correct any settings before starting the game */
async function validateGameSettings(lobby: GameLobby) {
  const settings = lobby.settings;
  const defaults = defaultLobbySettings();
  // 1. Fix any invalid numbers:
  if (isNaN(settings.max_turns) || settings.max_turns < 1) {
    settings.max_turns = defaults.max_turns;
  }
  if (isNaN(settings.max_score) || settings.max_score < 1) {
    settings.max_score = defaults.max_score;
  }
  if (
    isNaN(settings.cards_per_person) ||
    settings.cards_per_person < 2 ||
    settings.cards_per_person > 99
  ) {
    settings.cards_per_person = defaults.cards_per_person;
  }
  if (isNaN(settings.turns_per_person) || settings.turns_per_person < 1) {
    settings.turns_per_person = defaults.turns_per_person;
  }
  // 2. Adjust max_turns for turns_per_person
  if (settings.play_until === 'max_turns_per_person') {
    const playerCount = await countPlayers(lobby.id, 'player');
    settings.max_turns = Math.min(25, playerCount * settings.turns_per_person);
  }
  await updateLobby(lobby);
}

/**
 * Copy cards from all added decks into the lobby.
 * Copy the content because the deck could be edited or deleted in the future.
 */
async function copyDecksToLobby(lobby: GameLobby): Promise<void> {
  const newPrompts = new Array<PromptCardInGame>();
  const newResponses = new Array<ResponseCardInGame>();
  // Verify that the user has access to locked decks:
  for (const deckID of lobby.deck_ids) {
    const deck = await getDeck(deckID);
    if (deck.visibility == 'locked') {
      const access = await verifyUserHasDeckKey(lobby.creator_uid, deckID);
      if (!access) {
        throw new HttpsError(
          'permission-denied',
          `Incorrect password for deck '${deckID}'`,
        );
      }
    }
  }
  // Copy all decks in sequence:
  // (sorry I failed to do parallel...)
  // See https://stackoverflow.com/a/37576787/1093712
  for (const deckID of lobby.deck_ids) {
    const prompts = await getAllPromptsForGame(deckID, lobby.settings);
    newPrompts.push(...prompts);
    const responses = await getAllResponsesForGame(deckID, lobby.settings);
    newResponses.push(...responses);
    logger.info(
      `Fetched ${prompts.length} prompts and ${responses.length} responses from deck ${deckID}`,
    );
  }
  // Write all cards to the lobby:
  const lobbyPromptsRef = firestore
    .collection(`lobbies/${lobby.id}/deck_prompts`)
    .withConverter(promptCardInGameConverter);
  const lobbyResponsesRef = firestore
    .collection(`lobbies/${lobby.id}/deck_responses`)
    .withConverter(responseCardInGameConverter);
  await firestore.runTransaction(async (transaction) => {
    newPrompts.forEach((card) =>
      transaction.set(lobbyPromptsRef.doc(card.id), card),
    );
    newResponses.forEach((card) =>
      transaction.set(lobbyResponsesRef.doc(card.id), card),
    );
  });
  logger.info(
    `Copied ${newPrompts.length} prompts and ${newResponses.length} responses to lobby ${lobby.id}`,
  );
}

/** Sets lobby status to "ended", and performs any cleanup */
export async function endLobby(lobby: GameLobby) {
  lobby.status = 'ended';
  await updateLobby(lobby);
  logger.info(`Ended lobby ${lobby.id}`);
}

/** Unsets current_lobby_id for all players */
export async function cleanUpEndedLobby(lobbyID: string) {
  const players = await getPlayers(lobbyID);
  for (const player of players) {
    const caaUser = await getCAAUser(player.uid);
    if (caaUser) {
      if (caaUser.current_lobby_id === lobbyID) {
        await usersRef
          .doc(player.uid)
          .update({ current_lobby_id: FieldValue.delete() });
      }
    }
  }
  logger.info(`Cleaned up lobby ${lobbyID}`);
}

/**
 * Returns a sequence of player UIDs.
 * Next judge is selected by rotating it.
 * The sequence must be stable!
 */
export async function getPlayerSequence(
  lobbyID: string,
): Promise<Array<PlayerInLobby>> {
  const players = await getOnlinePlayers(lobbyID);
  // Sort players by random_index:
  return players.sort((a, b) => a.random_index - b.random_index);
}

/** Returns the next player in the sequence after the given userID. */
export function findNextPlayer(
  sequence: Array<PlayerInLobby>,
  userID?: string,
): PlayerInLobby | null {
  if (sequence.length === 0) return null;
  const lastIndex = sequence.findIndex((p) => p.uid === userID);
  if (lastIndex === -1) return sequence[0];
  let nextIndex = lastIndex + 1;
  if (nextIndex >= sequence.length) nextIndex = 0;
  return sequence[nextIndex];
}

/** Cleanup logic to run if the player becomes unavailable. */
export async function cleanUpPlayer(lobbyID: string, player: PlayerInLobby) {
  const lobby = await getLobby(lobbyID);
  const sequence = await getPlayerSequence(lobbyID);

  // If player is already not "online", re-insert them back in the sequence:
  if (sequence.findIndex((p) => p.uid === player.uid) === -1) {
    sequence.push(player);
    sequence.sort((a, b) => a.random_index - b.random_index);
  }
  const nextPlayer = findNextPlayer(sequence, player.uid);

  if (!nextPlayer || nextPlayer.uid === player.uid) {
    // No more players, end game:
    await endLobby(lobby);
  } else {
    // Re-assign lobby creator:
    if (lobby.creator_uid === player.uid) {
      lobby.creator_uid = nextPlayer.uid;
      await updateLobby(lobby);
    }

    if (lobby.status === 'in_progress') {
      // If you're the current judge, reassign this role to the next user:
      const lastTurn = await getLastTurn(lobby);
      if (lastTurn?.judge_uid === player.uid && lastTurn.phase !== 'complete') {
        lastTurn.judge_uid = nextPlayer.uid;
        await updateTurn(lobbyID, lastTurn);
      }
    }
  }
  // Unset 'current lobby':
  await setUsersCurrentLobby(player.uid, undefined);
}

/** Called when a player loses connection, or closes the browser.
 * An automatic trigger will call the cleanup logic after this. */
export async function setPlayerOffline(userID: string) {
  const caaUser = await getCAAUser(userID);
  const lobbyID = caaUser?.current_lobby_id;
  if (lobbyID) {
    const player = await getPlayer(lobbyID, userID);
    if (player) {
      player.status = 'left';
      await updatePlayer(lobbyID, player);
    }
  }
}

/** Throws if lobby limit has been reached. */
async function assertLobbyLimit() {
  const totalActiveLobbies = (
    await lobbiesRef.where('status', 'in', ['new', 'in_progress']).count().get()
  ).data().count;
  if (totalActiveLobbies > firebaseConfig.maxActiveLobbies) {
    throw new HttpsError(
      'resource-exhausted',
      'Game limit reached. Please try again later.',
    );
  }
}

/**
 * Creates a new lobby by copying all settings and players from the given lobby.
 * Throws if maximum number of active lobbies is reached.
 */
export async function createLobbyAsCopy(
  userID: string,
  oldLobby: GameLobby,
): Promise<GameLobby> {
  await assertNotAnonymous(userID);
  await assertLobbyLimit();
  const newLobbyRef = lobbiesRef.doc();
  const newID = newLobbyRef.id;
  const newLobby = new GameLobby(newID, userID, oldLobby.settings, 'new');
  newLobby.deck_ids = oldLobby.deck_ids;
  await newLobbyRef.set(newLobby);
  logger.info(
    `Created new lobby, copied from lobby ${oldLobby.id} by user: ${userID}`,
  );
  // Copy all players:
  const players = (await getPlayers(oldLobby.id)).filter(
    (p) => p.status === 'online',
  );
  const rng = RNG.fromStrSeedWithTimestamp(newLobby.id + userID);
  const newPlayers = players.map(
    (p) =>
      new PlayerInLobby(
        p.uid,
        p.name,
        p.avatar_id,
        rng.randomInt(),
        p.role,
        p.status,
      ),
  );
  const newPlayersRef = getPlayersRef(newLobby.id);
  await Promise.all(
    newPlayers
      .map((p) => [
        newPlayersRef.doc(p.uid).set(p),
        setUsersCurrentLobby(p.uid, newLobby.id),
      ])
      .flat(),
  );
  logger.info(
    `Copied players from lobby ${oldLobby.id} to lobby ${newLobby.id}`,
  );
  // Notify old lobby that it was copied:
  oldLobby.next_lobby_id = newLobby.id;
  await updateLobby(oldLobby);
  return newLobby;
}
