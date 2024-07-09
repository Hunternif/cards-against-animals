import { runTransaction } from 'firebase/firestore';
import {
  endLobbyFun,
  firestore,
  startLobbyFun,
  updateLobbySettingsFun,
} from '../../firebase';
import {
  GameLobby,
  GameTurn,
  LobbySettings,
  PlayerInLobby,
} from '../../shared/types';
import { assertExhaustive } from '../../shared/utils';
import { getAllPlayersStates } from './lobby-player-api';
import { getLobby, updateLobby } from './lobby-repository';

///////////////////////////////////////////////////////////////////////////////
//
//  API for changing data or settings of an existing lobby.
//
///////////////////////////////////////////////////////////////////////////////

/** Reassign lobby "creator" to a different user */
export async function setLobbyCreator(lobby: GameLobby, userID: string) {
  lobby.creator_uid = userID;
  await updateLobby(lobby);
}

export async function startLobby(lobby: GameLobby): Promise<void> {
  await startLobbyFun({ lobby_id: lobby.id });
}

export async function endLobby(lobby: GameLobby): Promise<void> {
  await endLobbyFun({ lobby_id: lobby.id });
}

export async function updateLobbySettings(
  lobbyID: string,
  settings: LobbySettings,
): Promise<void> {
  await updateLobbySettingsFun({ lobby_id: lobbyID, settings });
}

/** Should be used only during lobby setup */
export async function addDeck(
  lobby: GameLobby,
  deckID: string,
): Promise<GameLobby> {
  return await runTransaction(firestore, async (transaction) => {
    // Refresh lobby to get up-to-date list of decks:
    const updatedLobby = (await getLobby(lobby.id, transaction))!;
    updatedLobby.deck_ids.add(deckID);
    await updateLobby(updatedLobby, transaction);
    return updatedLobby;
  });
}

/** Should be used only during lobby setup */
export async function removeDeck(
  lobby: GameLobby,
  deckID: string,
): Promise<GameLobby> {
  return await runTransaction(firestore, async (transaction) => {
    // Refresh lobby to get up-to-date list of decks:
    const updatedLobby = (await getLobby(lobby.id, transaction))!;
    updatedLobby.deck_ids.delete(deckID);
    await updateLobby(updatedLobby, transaction);
    return updatedLobby;
  });
}

/** Returns true if game end condition has been reached. */
export async function checkIfShouldEndGame(
  lobby: GameLobby,
  turn: GameTurn,
  players: PlayerInLobby[],
): Promise<boolean> {
  switch (lobby.settings.play_until) {
    case 'forever':
      return false;
    case 'max_turns_per_person':
    // With turns per person, we set max_turns at the start of the game.
    // If a player joins during the game, we will add only 1 more turn.
    case 'max_turns':
      return turn.ordinal >= lobby.settings.max_turns;
    case 'max_score': {
      const playerStates = await getAllPlayersStates(lobby.id);
      for (const player of playerStates) {
        if (player.score >= lobby.settings.max_score) {
          return true;
        }
      }
      return false;
    }
    default:
      assertExhaustive(lobby.settings.play_until);
      return false;
  }
}
