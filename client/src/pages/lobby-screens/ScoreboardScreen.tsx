import { User } from "firebase/auth";
import { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { GameButton } from "../../components/Buttons";
import { Delay } from "../../components/Delay";
import { Scoreboard } from "../../components/Scoreboard";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { GameLobby, PlayerInLobby } from "../../shared/types";

interface Props {
  lobby: GameLobby,
  user: User,
  players: PlayerInLobby[],
}

const midRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  overflowY: "auto",
  width: "100vw",
  maxHeight: "70vh",
}

const botRowStyle: CSSProperties = {
  position: "relative",
  marginTop: "2rem",
  height: "3rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
}

export function ScoreboardScreen({ lobby, players }: Props) {
  const navigate = useNavigate();
  return <CenteredLayout className="scoreboard-screen">
    <h2>Scoreboard</h2>
    <div style={midRowStyle}>
      <Scoreboard lobby={lobby} players={players} />
    </div>
    <div style={botRowStyle}>
      <Delay>
        <GameButton secondary onClick={() => navigate("/")}>Go home</GameButton>
      </Delay>
    </div>
  </CenteredLayout>;
}