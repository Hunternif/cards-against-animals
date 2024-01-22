import { CSSProperties, useContext, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { endLobby, leaveLobby } from "../model/lobby-api";
import { ConfirmModal } from "./ConfirmModal";
import { CustomDropdown } from "./CustomDropdown";
import { ErrorContext } from "./ErrorContext";
import { useGameContext } from "./GameContext";
import { GamePlayerList } from "./GamePlayerList";
import { IconCounter } from "./IconCounter";
import { IconHeartInline, IconPersonInlineSmall, IconStarInline } from "./Icons";
import { Scoreboard } from "./Scoreboard";
import { Twemoji } from "./Twemoji";

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
export function GameMenu() {
  const navigate = useNavigate();
  const { lobby, turn, player, players, activePlayers, isSpectator } = useGameContext();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function handleLeave() {
    await leaveLobby(lobby, player.uid)
      .then(() => navigate("/"))
      .catch((e) => setError(e));
  }

  async function handleEnd() {
    setEnding(true);
    await endLobby(lobby).catch((e) => {
      setError(e);
      setEnding(false);
    });
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
            <IconCounter icon={<IconPersonInlineSmall />} count={activePlayers.length} />
          </InlineButton>
        }>
          <Dropdown.Menu>
            <GamePlayerList />
          </Dropdown.Menu>
        </CustomDropdown>
        <span className="menu-turn-ordinal">Turn {turn.ordinal}</span>
      </div>

      <div style={rightStyle}>
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
        <CustomDropdown showArrow
          toggle={
            <span className="light">
              {player.name}{isSpectator && " (spectator)"}
            </span>
          } toggleClassName="game-menu-icon">
          <Dropdown.Menu>
            <MenuItem label="Leave" onClick={() => setShowLeaveModal(true)} />
            <MenuItem label="End game" onClick={() => setShowEndModal(true)} judgeOnly />
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


interface MenuItemProps {
  label: string,
  judgeOnly?: boolean,
  onClick?: () => void,
}

function MenuItem({ label, onClick, judgeOnly }: MenuItemProps) {
  const { isJudge } = useGameContext();
  return (
    <Dropdown.Item
      onClick={onClick}
      disabled={judgeOnly && !isJudge}>
      {judgeOnly && !isJudge ? (
        // Only current judge can click this. Show an icon on the right.
        <span className="menu-item-locked" >{label}
          <Twemoji className="lock-icon" >👑</Twemoji></span>
      ) : label}
    </Dropdown.Item>
  );
}