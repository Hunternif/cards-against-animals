import { User } from 'firebase/auth';
import { useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import {
  useLobby,
  usePlayerInLobby,
  usePlayers,
} from '../api/lobby/lobby-hooks';
import { ErrorContext, useErrorContext } from '../components/ErrorContext';
import { ErrorModal } from '../components/ErrorModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuthWithPresence } from '../hooks/auth-hooks';
import { assertExhaustive } from '../shared/utils';
import { GameScreen } from './lobby-screens/GameScreen';
import { HomeScreen } from './lobby-screens/HomeScreen';
import { NewLobbyScreen } from './lobby-screens/NewLobbyScreen';
import { ScoreboardScreen } from './lobby-screens/ScoreboardScreen';
import { LocalSettingsContextProvider } from './lobby-screens/game-components/LocalSettingsContext';

interface LoaderParams {
  params: any;
}

export function lobbyLoader({ params }: LoaderParams): string {
  return params['lobbyID'] as string;
}

/** Root component */
export function LobbyPage() {
  const [error, setError] = useState(null);
  return (
    <>
      <ErrorModal error={error} setError={setError} />
      <ErrorContext.Provider value={{ error, setError }}>
        <LocalSettingsContextProvider>
          <LobbyPageThrows />
        </LocalSettingsContextProvider>
      </ErrorContext.Provider>
    </>
  );
}

/** User opened the lobby screen, but not necessarily logged in or in this lobby. */
function LobbyPageThrows() {
  // Double-check that we are logged in.
  // Users who are sent the link will need to log in first.
  const [user, loadingUser] = useAuthWithPresence();
  const lobbyID = useLoaderData() as string;
  if (loadingUser) return <LoadingSpinner delay text="Logging in..." />;
  if (!user) return <HomeScreen existingLobbyID={lobbyID} />;
  return <LoggedInLobbyScreen user={user} lobbyID={lobbyID} />;
}

interface LoggedInProps {
  lobbyID: string;
  user: User;
}

/** User logged in, but not necessarily joined the lobby. */
function LoggedInLobbyScreen({ lobbyID, user }: LoggedInProps) {
  const [player, loadingPlayer] = usePlayerInLobby(lobbyID, user);
  if (loadingPlayer) return <LoadingSpinner delay text="Loading user..." />;
  // User may be logged in, but we offer to change their name before joining:
  if (!player || player.status === 'left') {
    return <HomeScreen existingLobbyID={lobbyID} />;
  }
  return <JoinedLobbyScreen user={user} lobbyID={lobbyID} />;
}

interface LoggedInJoinedProps {
  lobbyID: string;
  user: User;
}

/** User logged in AND joined the lobby. */
function JoinedLobbyScreen({ lobbyID, user }: LoggedInJoinedProps) {
  const { setError } = useErrorContext();
  const [lobby, loadingLobby, lobbyError] = useLobby(lobbyID);
  const [players, loadingPlayers, playersError] = usePlayers(lobbyID);
  if (lobbyError || playersError) {
    setError(lobbyError || playersError);
  }

  if (loadingLobby || loadingPlayers)
    return <LoadingSpinner delay text="Loading lobby..." />;
  if (!lobby || !players) throw new Error(`Failed to load lobby ${lobbyID}`);
  switch (lobby.status) {
    case 'new':
    case 'starting':
      return <NewLobbyScreen lobby={lobby} user={user} players={players} />;
    case 'in_progress':
      return <GameScreen lobby={lobby} user={user} players={players} />;
    case 'ended':
      return <ScoreboardScreen lobby={lobby} user={user} players={players} />;
    default:
      assertExhaustive(lobby.status);
  }
}
