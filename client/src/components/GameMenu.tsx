import { User } from "firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { endLobby, leaveLobby } from "../model/lobby-api";
import { GameLobby, GameTurn, PlayerInLobby } from "../shared/types";
import { ConfirmModal } from "./ConfirmModal";
import { CustomDropdown } from "./CustomDropdown";
import { ErrorContext } from "./ErrorContext";
import { GamePlayerList } from "./GamePlayerList";
import { IconCounter } from "./IconCounter";
import { IconHeartInline, IconPersonInlineSmall, IconStarInline } from "./Icons";
import { Scoreboard } from "./Scoreboard";

interface MenuProps {
  lobby: GameLobby,
  user: User,
  turn: GameTurn,
  players: PlayerInLobby[],
}

const rowStyle: CSSProperties = {
  padding: "0.5rem",
  display: "flex",
  flexDirection: "row",
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
  alignItems: "center",
  gap: "0.5em",
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


/** Menu header on top of the game page */
export function GameMenu(
  { lobby, turn, user, players }: MenuProps
) {
  const navigate = useNavigate();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);

  const [playerListOpen, setPlayerListOpen] = useState(false);
  function openPlayerList() { setPlayerListOpen(true); }
  function closePlayerList() { setPlayerListOpen(false); }

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

    <div style={rowStyle}>
      <div style={leftStyle}>
        <CustomDropdown toggle={
          <InlineButton className="menu-player-counter" title="Players">
            <IconCounter icon={<IconPersonInlineSmall />} count={validPlayers.length} />
          </InlineButton>
        }>
          <Dropdown.Menu>
            <GamePlayerList lobby={lobby} turn={turn} user={user} players={players} />
          </Dropdown.Menu>
        </CustomDropdown>
        <span className="menu-turn-ordinal">Turn {turn.ordinal}</span>
      </div>

      <div style={rightStyle}>
        {(player) && <>
          <CustomDropdown toggle={
            <InlineButton title="Scores">
              <IconCounter icon={<IconStarInline />} count={player.score} />
              {player.likes > 0 && (
                <IconCounter icon={<IconHeartInline />} count={player.likes} />
              )}
            </InlineButton>
          }>
            <Dropdown.Menu>
              <div className="menu-scoreboard">
                <Scoreboard lobby={lobby} players={players} />
              </div>
            </Dropdown.Menu>
          </CustomDropdown>
        </>}
        <CustomDropdown showArrow
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

function InlineButton(props: React.HTMLProps<HTMLSpanElement>) {
  return <div className="menu-inline-button-block">
    <span {...props} className={`menu-inline-button ${props.className ?? ""}`} />
  </div>;
}