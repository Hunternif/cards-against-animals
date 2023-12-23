import { User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useCollectionData, useDocumentData } from "react-firebase-hooks/firestore";
import { endLobbyFun, findOrCreateLobbyAndJoinFun, findOrCreateLobbyFun, joinLobbyFun, lobbiesRef, startLobbyFun, usersRef } from "../firebase";
import { playerConverter } from "../shared/firestore-converters";
import { GameLobby, PlayerInLobby, PlayerStatus } from "../shared/types";
import { getAllTurns, getLastTurn, setTurnJudge } from "./turn-api";
import { getCAAUser } from "./users-api";

function getPlayersRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, 'players')
    .withConverter(playerConverter);
}

export async function getLobby(lobbyID: string): Promise<GameLobby | null> {
  return (await getDoc(doc(lobbiesRef, lobbyID))).data() ?? null;
}

async function updateLobby(lobby: GameLobby): Promise<void> {
  await setDoc(doc(lobbiesRef, lobby.id), lobby);
}

export async function updatePlayer(lobbyID: string, player: PlayerInLobby) {
  await setDoc(doc(getPlayersRef(lobbyID), player.uid), player);
}

export async function getAllPlayersInLobby(lobbyID: string):
  Promise<Array<PlayerInLobby>> {
  return (await getDocs(getPlayersRef(lobbyID))).docs.map((p) => p.data());
}

export async function getPlayerInLobby(lobbyID: string, userID: string):
  Promise<PlayerInLobby | null> {
  return (await getDoc(doc(getPlayersRef(lobbyID), userID))).data() ?? null;
}

export async function findOrCreateLobbyID(user: User): Promise<string> {
  const res = await findOrCreateLobbyFun({ creator_uid: user.uid });
  return res.data.lobby_id;
}

export async function findOrCreateLobby(user: User): Promise<GameLobby> {
  const lobbyID = await findOrCreateLobbyID(user);
  const lobby = await getLobby(lobbyID);
  if (!lobby) throw new Error("Couldn't find or create lobby");
  console.log(`Fetched lobby ${lobby.id}`);
  return lobby;
}

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export async function joinLobby(lobbyID: string, user: User): Promise<void> {
  await joinLobbyFun({ lobby_id: lobbyID, user_id: user.uid });
}

/** Remove yourself from this lobby */
export async function leaveLobby(lobby: GameLobby, user: User): Promise<void> {
  const players = await getAllPlayersInLobby(lobby.id);
  // If you're creator, reassign this role to the next user:
  if (lobby.creator_uid === user.uid) {
    const nextPlayer = players.find((p) => p.uid !== user.uid);
    if (nextPlayer) {
      await setLobbyCreator(lobby, nextPlayer.uid);
    } else {
      // You're the last player! Close the lobby:
      await endLobby(lobby);
    }
  }
  // If you're the current judge, reassign this role to the next user:
  const lastTurn = await getLastTurn(lobby.id);
  if (lastTurn && lastTurn.phase != "complete" && lastTurn.judge_uid === user.uid) {
    const nextPlayer = players.find((p) => p.uid !== user.uid);
    if (nextPlayer) {
      await setTurnJudge(lobby, lastTurn, nextPlayer.uid);
    } // else should not happen
  }

  // Delete your user info which contains 'current lobby':
  // - unless you're admin. In that case, remove the field.
  const caaUser = await getCAAUser(user.uid);
  if (caaUser?.is_admin) {
    delete caaUser.current_lobby_id;
    await setDoc(doc(usersRef, user.uid), caaUser);
  } else {
    await deleteDoc(doc(usersRef, user.uid));
  }

  // Lastly, set player status in lobby as "left":
  // (do it last, so you won't see the error due to failing to load lobby)
  await setPlayerStatus(lobby.id, user.uid, "left");
}

/** Updates player status in the current game. */
export async function setPlayerStatus(
  lobbyID: string, userID: string, status: PlayerStatus
) {
  const player = await getPlayerInLobby(lobbyID, userID);
  if (player) {
    player.status = status;
    await updatePlayer(lobbyID, player);
  }
}

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

/** Should be used only during lobby setup */
export async function addDeck(lobby: GameLobby, deckID: string): Promise<void> {
  lobby.deck_ids.add(deckID);
  await updateLobby(lobby);
}

/** Should be used only during lobby setup */
export async function removeDeck(lobby: GameLobby, deckID: string): Promise<void> {
  lobby.deck_ids.delete(deckID);
  await updateLobby(lobby);
}

/**
 * Will find an active game or create a new one, and attempt to join.
 * Returns lobby ID.
 */
export async function findOrCreateLobbyAndJoin(user: User): Promise<string> {
  const res = await findOrCreateLobbyAndJoinFun({ user_id: user.uid });
  return res.data.lobby_id;
}

export async function isUserInLobby(lobbyID: string, user: User): Promise<boolean> {
  const caaUser = await getCAAUser(user.uid);
  return caaUser?.current_lobby_id === lobbyID;
}

/** If the user is not already in the lobby, joins it. */
export async function joinLobbyIfNeeded(lobbyID: string, user: User) {
  if (!await isUserInLobby(lobbyID, user)) {
    await joinLobby(lobbyID, user);
  }
}

interface PlayerScore {
  player: PlayerInLobby;
  score: number;
}

// const dummyScore = {
//   player: new PlayerInLobby("01", "Dummy", "player", "online"),
//   score: 3,
// }

/**
 * Calculates scores for all users from all turns in the lobby,
 * including players who have left the game.
 * Returns a map from player object to their score number, in descending order.
*/
export async function getScoreboard(lobbyID: string): Promise<Array<PlayerScore>> {
  // return new Array<PlayerScore>(50).fill(dummyScore, 0, 50);
  // map uid to result
  const board = new Map<string, PlayerScore>();
  const players = await getAllPlayersInLobby(lobbyID);
  // map uid to player:
  const playerMap = new Map(players.map((p) => [p.uid, p]));
  const turns = await getAllTurns(lobbyID);
  for (const turn of turns) {
    if (turn.winner_uid) {
      const winner = playerMap.get(turn.winner_uid);
      if (winner) {
        const entry = board.get(turn.winner_uid);
        if (entry) {
          entry.score++;
        } else {
          board.set(turn.winner_uid, { player: winner, score: 1 });
        }
      }
    }
  }
  return Array.from(board.values()).sort((a, b) => b.score - a.score);
}


/** React hook to join lobby, if the user is not in it. */
export function useJoinLobby(lobbyID: string, user: User): [joined: boolean] {
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    joinLobbyIfNeeded(lobbyID, user).then(() => {
      setJoined(true);
    }).catch((e) => setError(e));
  }, [lobbyID, user.uid]);
  if (error) throw error;
  return [joined];
}

/** React hook to fetch lobby data and subscribe to it. */
export function useLobby(lobbyID: string) {
  return useDocumentData(doc(lobbiesRef, lobbyID));
}

/** React hook to fetch list of players and subscribe to it. */
export function usePlayers(lobbyID: string) {
  return useCollectionData(query(
    getPlayersRef(lobbyID),
    orderBy('time_joined', 'asc'))
  );
}

/** React hook to fetch and subscribe to user data from player list in lobby. */
export function usePlayerInLobby(lobbyID: string, user: User) {
  return useDocumentData(doc(getPlayersRef(lobbyID), user.uid));
}


type ScoresHook = [
  scores: Array<PlayerScore> | null,
  loading: boolean,
  error: any,
]

/** React hook to fetch scoreboard data once. */
export function useScores(lobbyID: string): ScoresHook {
  const [scores, setScores] = useState<Array<PlayerScore> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true);
    getScoreboard(lobbyID).then((scores) => {
      setScores(scores);
      setLoading(false);
    }).catch((e) => {
      setError(e);
      setLoading(false);
    });
  }, [lobbyID]);
  return [scores, loading, error];
}