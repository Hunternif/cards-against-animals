import { User } from "firebase/auth";
import { GameLobby } from "../model/types";

interface Props {
  user: User;
  lobby: GameLobby;
}

export function Lobby({ user, lobby }: Props) {
  return <>
    {lobby && <h2>Your lobby: {lobby.id}</h2>}
  </>;
}