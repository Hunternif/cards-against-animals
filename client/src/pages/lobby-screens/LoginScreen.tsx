import { User } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnonymousLogin } from "../../components/AnonymousLogin";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { findOrCreateLobbyAndJoin, getPlayerInLobby, joinLobbyIfNeeded, setPlayerStatus, updatePlayer } from "../../model/lobby-api";
import { LoadingSpinner } from "../../components/LoadingSpinner";

interface Props {
  existingLobbyID?: string,
}

export function LoginScreen({ existingLobbyID }: Props) {
  const [error, setError] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  if (error) throw error;
  const loadingNode = joining ? (existingLobbyID ?
    <LoadingSpinner text="Joining..." /> :
    <LoadingSpinner text="Starting new lobby..." />
  ) : undefined;

  async function handleLogin(user: User) {
    try {
      setJoining(true);
      if (existingLobbyID) {
        await joinLobbyIfNeeded(existingLobbyID, user);
        // If previously left, re-join:
        const player = await getPlayerInLobby(existingLobbyID, user.uid);
        if (player?.status === "left") {
          player.status = "online";
          if (user.displayName) player.name = user.displayName;
          await updatePlayer(existingLobbyID, player);
        }
      } else {
        const lobbyID = await findOrCreateLobbyAndJoin(user);
        navigate(`/${lobbyID}`);
      }
      setJoining(false);
    } catch (e: any) {
      setError(e);
    }
  }
  return <CenteredLayout outerClassName="welcome-screen">
    <h1>Cards Against Animals</h1>
    <AnonymousLogin onLogin={handleLogin} loadingNode={loadingNode} />
  </CenteredLayout>;
}