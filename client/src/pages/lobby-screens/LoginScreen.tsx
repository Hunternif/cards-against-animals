import { User } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnonymousLogin } from "../../components/AnonymousLogin";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { findOrCreateLobbyAndJoin, joinLobbyIfNeeded } from "../../model/lobby-api";

interface Props {
  existingLobbyID?: string,
}

export function LoginScreen({ existingLobbyID }: Props) {
  const [error, setError] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  if (error) throw error;

  async function handleLogin(user: User) {
    try {
      setJoining(true);
      if (existingLobbyID) {
        await joinLobbyIfNeeded(existingLobbyID, user);
      } else {
        const lobbyID = await findOrCreateLobbyAndJoin(user);
        navigate(`/${lobbyID}`);
      }
      setJoining(false);
    } catch (e: any) {
      setError(e);
    }
  }
  return <CenteredLayout className="welcome-screen">
    <h1>Cards Against Animals</h1>
    <AnonymousLogin onLogin={handleLogin} joining={joining} />
  </CenteredLayout>;
}