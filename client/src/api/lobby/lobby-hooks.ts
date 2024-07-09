import { User } from 'firebase/auth';
import { orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  useCollectionData,
  useDocumentData,
} from 'react-firebase-hooks/firestore';
import { useNavigate } from 'react-router-dom';
import { useDocumentDataOrDefault } from '../../hooks/data-hooks';
import { CAAUser, GameLobby, PlayerGameState } from '../../shared/types';
import { joinLobbyIfNeeded } from './lobby-join-api';
import {
  getPlayerRef,
  getPlayerStateRef,
  getPlayersRef,
} from './lobby-player-api';
import { getLobbyRef } from './lobby-repository';

///////////////////////////////////////////////////////////////////////////////
//
//  React Hooks for lobby
//
///////////////////////////////////////////////////////////////////////////////

/** React hook to join lobby, if the user is not in it. */
export function useJoinLobby(
  lobbyID: string,
  caaUser: CAAUser,
): [joined: boolean] {
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    joinLobbyIfNeeded(lobbyID, caaUser)
      .then(() => {
        setJoined(true);
      })
      .catch((e: any) => setError(e));
  }, [lobbyID, caaUser.uid]);
  if (error) throw error;
  return [joined];
}

/** React hook to fetch lobby data and subscribe to it. */
export function useLobby(lobbyID: string) {
  return useDocumentData(getLobbyRef(lobbyID));
}

/** React hook to fetch list of players and subscribe to it. */
export function usePlayers(lobbyID: string) {
  return useCollectionData(
    query(getPlayersRef(lobbyID), orderBy('time_joined', 'asc')),
  );
}

/** React hook to fetch and subscribe to user data from player list in lobby. */
export function usePlayerInLobby(lobbyID: string, user: User) {
  return useDocumentData(getPlayerRef(lobbyID, user.uid));
}

/** React hook to fetch and subscribe to this player's game sate. */
export function usePlayerState(lobby: GameLobby, userID: string) {
  return useDocumentDataOrDefault(
    getPlayerStateRef(lobby.id, userID),
    new PlayerGameState(userID, 0, 0, 0, 0),
  );
}

/** If a "next lobby ID" is set on this lobby, redirects to it. */
export function useRedirectToNextLobby(lobby: GameLobby) {
  const navigate = useNavigate();
  const existingNextLobbyID = useMemo(() => lobby.next_lobby_id, []);

  // When next lobby id first arrives, redirect to the new lobby page:
  useEffect(() => {
    if (existingNextLobbyID == null && lobby.next_lobby_id != null) {
      navigate(`/${lobby.next_lobby_id}`);
    }
  }, [lobby.next_lobby_id]);
}
