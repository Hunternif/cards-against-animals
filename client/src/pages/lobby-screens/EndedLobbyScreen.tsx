import { User } from "firebase/auth";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { GameLobby } from "../../shared/types";

interface Props {
  lobby: GameLobby,
  user: User,
}

export function EndedLobbyScreen({ lobby, user }: Props) {
  return <CenteredLayout>
    <h2>Lobby has ended.</h2>
  </CenteredLayout>;
}