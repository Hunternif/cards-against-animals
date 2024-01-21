import { User } from "firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { endLobby, leaveLobby } from "../model/lobby-api";
import { GameLobby, GameTurn, PlayerInLobby } from "../shared/types";
import { ConfirmModal } from "./ConfirmModal";
import { CustomDropdown } from "./CustomDropdown";
import { ErrorContext } from "./ErrorContext";
import { IconHeartInline, IconPerson, IconStarInline } from "./Icons";
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
  gap: "1em",
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

const playerListStyle: CSSProperties = {

}

export function GameMenu(
  { lobby, turn, user, players, className, style }: MenuProps
) {
  const navigate = useNavigate();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;
  const player = players.find((p) => p.uid === user.uid);
  const isSpectator = player?.role === "spectator";

  // Filter out people who left:
  const validPlayers = players.filter((p) => p.status === "online");

  async function handleLeave() {
    await leaveLobby(lobby, user)
      .then(() => navigate("/"))
      .catch((e) => setError(e));
  }

  async function handleEnd() {
    setEnding(true);
    await endLobby(lobby).catch((e) => setError(e));
  }

  return <>
    <ConfirmModal
      show={showLeaveModal}
      text="Leave the game?"
      onCancel={() => setShowLeaveModal(false)}
      onConfirm={handleLeave}
    />
    <ConfirmModal
      show={showEndModal}
      text="End the game for everyone?"
      onCancel={() => setShowEndModal(false)}
      onConfirm={handleEnd}
      loading={ending}
      loadingText="Ending game..."
    />
    <div style={{ ...rowStyle, ...style }}>
      <div style={leftStyle}>
        <span className="menu-turn-ordinal">Turn {turn.ordinal}</span>
        <span style={playerListStyle} className="menu-player-count">
          <IconPerson height={14} />
          <span className="small-player-count">{validPlayers.length} </span>
        </span>
      </div>
      <div style={rightStyle}>
        {(player) && <>
          <CustomDropdown className={className}
            toggle={
              <span className="score-menu-icon">
                <span><IconStarInline />{player.score > 1 && ` ${player.score}`}</span>
                {player.likes > 0 && <span>
                  <IconHeartInline />{player.likes > 1 && ` ${player.likes}`}
                </span>}
              </span>
            }>
            <Dropdown.Menu>
              <div className="menu-scoreboard">
                <Scoreboard lobby={lobby} players={players} />
              </div>
            </Dropdown.Menu>
          </CustomDropdown>
        </>}
        <CustomDropdown className={className} showArrow
          toggle={
            <span className="light">
              {user.displayName}{isSpectator && " (spectator)"}
            </span>
          } toggleClassName="game-menu-icon">
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setShowLeaveModal(true)}>Leave</Dropdown.Item>
            {isJudge && <Dropdown.Item onClick={() => setShowEndModal(true)}>End game</Dropdown.Item>}
          </Dropdown.Menu>
        </CustomDropdown>
      </div>
    </div>
  </>;
}