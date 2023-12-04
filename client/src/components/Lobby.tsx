import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { useEffectOnce } from "./utils";
import { GameLobby } from "../model/types";
import { findOrCreateLobby } from "../model/lobby-api";

interface Props {
  user: User;
}

export function Lobby({ user }: Props) {
  const [error, setError] = useState<Error | null>(null);

  const [lobby, setLobby] = useState<GameLobby | null>(null);

  useEffectOnce(() => {
    findOrCreateLobby(user).then(
      (newLobby) => setLobby(newLobby)
    ).catch(e => setError(e));
  });
  if (error) throw error;
  return <>
    {lobby && <h2>Your lobby: {lobby.id}</h2>}
  </>;
}