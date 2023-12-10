import { User } from "firebase/auth";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { GameLobby } from "../../shared/types";

interface Props {
  lobby: GameLobby,
  user: User,
}

export function GameScreen({ lobby, user }: Props) {
  return <CenteredLayout>
    <h2>Let's game!</h2>
  </CenteredLayout>;
}