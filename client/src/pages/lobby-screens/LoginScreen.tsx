import { User, onAuthStateChanged } from "firebase/auth";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorContext } from "../../components/ErrorContext";
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
import { CAAUser } from "../../shared/types";
import { AnonymousLogin } from "./login-components/AnonymousLogin";

interface Props {
  existingLobbyID?: string,
}

export function LoginScreen({ existingLobbyID }: Props) {
  const [joining, setJoining] = useState(false);
  const [pastLobbyID, setPastLobbyID] = useState<string | null>(null);
  const { setError } = useContext(ErrorContext);
  const navigate = useNavigate();

  // Check existing user and lobby
  // TODO: try to remove this to prevent flashing the page when user logs in.
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

  async function handleLogin(user: User, caaUser: CAAUser) {
    try {
      setJoining(true);
      if (existingLobbyID) {
        await joinLobbyIfNeeded(existingLobbyID, user);
        // Check if already in this lobby:
        const player = await getPlayerInLobby(existingLobbyID, user.uid);
        if (player) {
          // Update player data in game:
          player.name = caaUser.name;
          player.avatar_id = caaUser.avatar_id;
          // If previously left, re-join:
          if (player?.status === "left") {
            player.status = "online";
          }
          await updatePlayer(existingLobbyID, player);
        }
      } else {
        const lobbyID = await findOrCreateLobbyAndJoin(user);
        navigate(`/${lobbyID}`);
      }
      setJoining(false);
    } catch (e: any) {
      setError(e);
      setJoining(false);
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