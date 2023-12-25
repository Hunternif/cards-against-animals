import { User } from "firebase/auth";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { endLobby, getPlayerScore, leaveLobby } from "../model/lobby-api";
import { GameLobby, GameTurn, PlayerInLobby } from "../shared/types";
import { CustomDropdown } from "./CustomDropdown";
import { ErrorContext } from "./ErrorContext";
import { Scoreboard } from "./Scoreboard";

interface MenuProps {
  lobby: GameLobby,
  user: User,
  turn: GameTurn,
  players: PlayerInLobby[],
  className?: string,
  style?: CSSProperties,
}

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "0.5rem",
  zIndex: 99,
}

export function GameMenu(
  { lobby, turn, user, players, className, style }: MenuProps
) {
  const navigate = useNavigate();
  const [score, setScore] = useState<number | null>(null);
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;
  const isSpectator = players.find((p) => p.uid === user.uid)?.role === "spectator";

  async function handleLeave() {
    await leaveLobby(lobby, user)
      .then(() => navigate("/"))
      .catch((e) => setError(e));
  }

  async function handleEnd() {
    await endLobby(lobby).catch((e) => setError(e));
  }

  useEffect(() => {
    getPlayerScore(lobby.id, user.uid)
      .then((res) => setScore(res))
      .catch((e) => setError(e));
  }, [turn.id]);

  return (
    <div style={{ ...rowStyle, ...style }}>
      {(score !== null) && <CustomDropdown className={className}
        toggle={
          <span className="score-menu-icon">⭐{score}</span>
        }>
        <Dropdown.Menu>
          <div className="menu-scoreboard">
            <Scoreboard lobby={lobby} />
          </div>
        </Dropdown.Menu>
      </CustomDropdown>}
      <CustomDropdown className={className} showArrow
        toggle={
          <span className="light">
            {user.displayName}{isSpectator && " (spectator)"}
          </span>
        } toggleClassName="game-menu-icon">
        <Dropdown.Menu>
          <Dropdown.Item onClick={handleLeave}>Leave</Dropdown.Item>
          {isJudge && <Dropdown.Item onClick={handleEnd}>End game</Dropdown.Item>}
        </Dropdown.Menu>
      </CustomDropdown>
    </div>
  );
}