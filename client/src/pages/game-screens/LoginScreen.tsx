import { User } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnonymousLogin } from "../../components/AnonymousLogin";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { findOrCreateLobbyAndJoin } from "../../model/lobby-api";

export function LoginScreen() {
  const [error, setError] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  if (error) throw error;

  async function handleLogin(user: User) {
    try {
      setJoining(true);
      const lobbyID = await findOrCreateLobbyAndJoin(user);
      navigate(lobbyID);
      setJoining(false);
    } catch (e: any) {
      setError(e);
    }
  }
  return <CenteredLayout>
    <h1 style={{ marginBottom: "1em" }}>Cards Against Animals</h1>
    <AnonymousLogin onLogin={handleLogin} disabled={joining}/>
  </CenteredLayout>;
}