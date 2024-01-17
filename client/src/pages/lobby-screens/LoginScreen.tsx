import { User, onAuthStateChanged } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnonymousLogin } from "../../components/AnonymousLogin";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { useEffectOnce } from "../../components/utils";
import { firebaseAuth } from "../../firebase";
import {
  findOrCreateLobbyAndJoin,
  getPlayerInLobby,
  joinLobbyIfNeeded,
  updatePlayer
} from "../../model/lobby-api";
import { findPastLobbyID } from "../../model/users-api";

interface Props {
  existingLobbyID?: string,
}

export function LoginScreen({ existingLobbyID }: Props) {
  const [error, setError] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [pastLobbyID, setPastLobbyID] = useState<string | null>(null);
  const navigate = useNavigate();

  if (error) throw error;

  // Check existing user and lobby
  useEffectOnce(() => {
    // Load past lobby
    return onAuthStateChanged(firebaseAuth, (newUser) => {
      if (newUser) {
        findPastLobbyID(newUser.uid).then((lobbyID) => {
          setPastLobbyID(lobbyID);
        })
      }
    });
  });

  const buttonText = pastLobbyID ? "Rejoin game" :
    existingLobbyID ? "Join game" : "Start new game";
  const loadingText = pastLobbyID ? "Rejoining..." :
    existingLobbyID ? "Joining..." : "Starting new lobby...";
  const loadingNode = joining ? <LoadingSpinner text={loadingText} /> : undefined;

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
    <CenteredLayout>
      <AnonymousLogin onLogin={handleLogin} loadingNode={loadingNode}
        buttonText={buttonText} />
    </CenteredLayout>
  </CenteredLayout>;
}