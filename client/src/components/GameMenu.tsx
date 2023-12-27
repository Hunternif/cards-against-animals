import { User } from "firebase/auth";
import { CSSProperties, useContext } from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { endLobby, leaveLobby } from "../model/lobby-api";
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

const leftStyle: CSSProperties = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: "0%",
  display: "flex",
  justifyContent: "flex-start",
};
const midStyle: CSSProperties = {
  flexGrow: 1,
  flexShrink: 0,
  flexBasis: "0%",
  display: "flex",
  justifyContent: "center",
};
const rightStyle: CSSProperties = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: "0%",
  display: "flex",
  gap: "0.5em",
  justifyContent: "flex-end",
  alignItems: "center",
};

export function GameMenu(
  { lobby, turn, user, players, className, style }: MenuProps
) {
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;
  const player = players.find((p) => p.uid === user.uid);
  const isSpectator = player?.role === "spectator";

  async function handleLeave() {
    await leaveLobby(lobby, user)
      .then(() => navigate("/"))
      .catch((e) => setError(e));
  }

  async function handleEnd() {
    await endLobby(lobby).catch((e) => setError(e));
  }

  return (
    <div style={{ ...rowStyle, ...style }}>
      <div style={leftStyle}>
        <span className="menu-turn-ordinal">Turn {turn.ordinal}</span>
      </div>
      <div style={rightStyle}>
        {(player) && <CustomDropdown className={className}
          toggle={
            <span className="score-menu-icon">⭐{player.score}</span>
          }>
          <Dropdown.Menu>
            <div className="menu-scoreboard">
              <Scoreboard lobby={lobby} players={players} />
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
    </div>
  );
}