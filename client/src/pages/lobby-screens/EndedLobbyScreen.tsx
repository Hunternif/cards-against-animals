import { User } from "firebase/auth";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { GameLobby } from "../../shared/types";
import { useNavigate } from "react-router-dom";
import { GameButton } from "../../components/Buttons";
import { CSSProperties } from "react";

interface Props {
  lobby: GameLobby,
  user: User,
}

const botRowStyle: CSSProperties = {
  position: "relative",
  marginTop: "1.5rem",
  height: "3rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
}

export function EndedLobbyScreen({ lobby, user }: Props) {
  const navigate = useNavigate();
  return <CenteredLayout>
    <h2>Lobby has ended.</h2>
    <div style={botRowStyle}>
      <GameButton secondary onClick={() => navigate("/")}>Go home</GameButton>
    </div>
  </CenteredLayout>;
}