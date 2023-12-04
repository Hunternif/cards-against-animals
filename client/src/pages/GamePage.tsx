import { useState } from "react";
import { AnonymousLogin } from "../components/AnonymousLogin";
import { CenteredLayout } from "../components/layout/CenteredLayout";
import { Lobby } from "../components/Lobby";
import { User } from "firebase/auth";
import { GameLobby } from "../model/types";
import { findOrCreateLobby } from "../model/lobby-api";

export function GamePage() {
  const [user, setUser] = useState<User | null>(null);
  const [lobby, setLobby] = useState<GameLobby | null>(null);
  const [error, setError] = useState<any>(null);
  if (error) throw error;

  async function handleLogin(newUser: User) {
    setUser(newUser);
    try {
      const newLobby = await findOrCreateLobby(newUser);
      setLobby(newLobby);
    } catch (e: any) {
      setError(e);
    }
  }

  return <CenteredLayout>
    {user && lobby ? <Lobby user={user} lobby={lobby} /> : (<>
      <h1 style={{ marginBottom: "1em" }}>Cards Against Animals</h1>
      <AnonymousLogin onLogin={handleLogin} />
    </>)}
  </CenteredLayout>;
}