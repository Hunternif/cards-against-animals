import { User } from "firebase/auth";
import { useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLoaderData } from "react-router-dom";
import { ErrorContext } from "../components/ErrorContext";
import { ErrorModal } from "../components/ErrorModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { firebaseAuth } from "../firebase";
import { setPlayerStatus, useLobby, usePlayerInLobby, usePlayers } from "../model/lobby-api";
import { EndedLobbyScreen } from "./lobby-screens/EndedLobbyScreen";
import { GameScreen } from "./lobby-screens/GameScreen";
import { LoginScreen } from "./lobby-screens/LoginScreen";
import { NewLobbyScreen } from "./lobby-screens/NewLobbyScreen";
import { PlayerInLobby } from "../shared/types";

interface LoaderParams {
  params: any
}

export function lobbyLoader({ params }: LoaderParams): string {
  return params['lobbyID'] as string;
}

/** Root component */
export function LobbyPage() {
  const [error, setError] = useState<any | null>(null);
  return <>
    <ErrorModal error={error} setError={setError} />
    <ErrorContext.Provider value={{ error, setError }}>
      <LobbyPageThrows />
    </ErrorContext.Provider>
  </>;
}

/** User opened the lobby screen, but not necessarily logged in or in this lobby. */
function LobbyPageThrows() {
  // Double-check that we are logged in.
  // Users who are sent the link will need to log in first.
  const [user, loadingUser] = useAuthState(firebaseAuth);
  const lobbyID = useLoaderData() as string;
  if (loadingUser) return <LoadingSpinner delay text="Logging in..." />;
  if (!user) return <LoginScreen existingLobbyID={lobbyID} />;
  return <LoggedInLobbyScreen user={user} lobbyID={lobbyID} />;
}

interface LoggedInProps {
  lobbyID: string,
  user: User,
}

/** User logged in, but not necessarily joined the lobby. */
function LoggedInLobbyScreen({ lobbyID, user }: LoggedInProps) {
  const [player, loadingPlayer] = usePlayerInLobby(lobbyID, user);
  if (loadingPlayer) return <LoadingSpinner delay text="Loading user..." />;
  // User may be logged in, but we offer to change their name before joining:
  if (!player) return <LoginScreen existingLobbyID={lobbyID} />;
  return <JoinedLobbyScreen user={user} lobbyID={lobbyID} player={player} />
}

interface LoggedInJoinedProps {
  lobbyID: string,
  user: User,
  player: PlayerInLobby;
}

/** User logged in AND joined the lobby. */
function JoinedLobbyScreen({ lobbyID, user, player }: LoggedInJoinedProps) {
  const [lobby, loadingLobby] = useLobby(lobbyID);
  const [players, loadingPlayers] = usePlayers(lobbyID);
  const { setError } = useContext(ErrorContext);

  async function rejoin() {
    if (player.status === "left") {
      await setPlayerStatus(lobbyID, player.uid, "online");
    }
  }

  useEffect(() => {
    // If re-joining, set status to online:
    rejoin().catch((e) => setError(e));;
  }, [player.uid]);

  if (loadingLobby || loadingPlayers) return <LoadingSpinner delay text="Loading lobby..." />;
  if (!lobby || !players) throw new Error(`Failed to load lobby ${lobbyID}`);
  switch (lobby.status) {
    case "new":
      return <NewLobbyScreen lobby={lobby} user={user} players={players} />;
    case "in_progress":
      return <GameScreen lobby={lobby} user={user} players={players} />;
    case "ended":
      return <EndedLobbyScreen lobby={lobby} user={user} />;
    default:
      throw new Error(`Unknown lobby status "${lobby.status}"`);
  }
}