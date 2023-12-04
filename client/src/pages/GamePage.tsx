import { useState } from "react";
import { AnonymousLogin } from "../components/AnonymousLogin";
import { CenteredLayout } from "../components/layout/CenteredLayout";
import { Lobby } from "../components/Lobby";
import { User } from "firebase/auth";

export function GamePage() {
  const [user, setUser] = useState<User | null>(null);
  return <CenteredLayout>
    {user ? <Lobby user={user} /> : (<>
      <h1 style={{ marginBottom: "1em" }}>Cards Against Animals</h1>
      <AnonymousLogin onLogin={(user) => setUser(user)} />
    </>)}
  </CenteredLayout>;
}