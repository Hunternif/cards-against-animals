import { ReactNode, useContext, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { CustomDropdown } from "../../../components/CustomDropdown";
import { ErrorContext } from "../../../components/ErrorContext";
import { IconCounter } from "../../../components/IconCounter";
import { IconHeartInline, IconPersonInlineSmall, IconStarInline } from "../../../components/Icons";
import { PlayerAvatar } from "../../../components/PlayerAvatar";
import { Scoreboard } from "../../../components/Scoreboard";
import { Twemoji } from "../../../components/Twemoji";
import { endLobby, leaveLobby, updateLobbySettings } from "../../../model/lobby-api";
import { LobbySettings } from "../../../shared/types";
import { copyFields } from "../../../shared/utils";
import { LobbySettingsPanel } from "../lobby-components/LobbySettingsPanel";
import { useGameContext } from "./GameContext";
import { GamePlayerList } from "./GamePlayerList";
import { InlineButton } from "../../../components/Buttons";


/** Menu header on top of the game page */
export function GameMenu() {
  const navigate = useNavigate();
  const { lobby, turn, player, players, activePlayers, isSpectator, isJudge,
    canControlLobby } = useGameContext();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);

  // Make a local copy of settings to make changes:
  const [settings, setSettings] = useState(lobby.settings);
  const [savingSettings, setSavingSettings] = useState(false);

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

  function openSettings() {
    // Make a local copy of settings to make changes:
    setSettings(copyFields(lobby.settings));
    setShowSettingsModal(true);
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await updateLobbySettings(lobby.id, settings);
      setShowSettingsModal(false);
    } catch (e) {
      setError(e);
    } finally {
      setSavingSettings(false);
    }
  }
  /** Causes the settings panel to rerender. */
  async function refreshSettings(newSettings: LobbySettings) {
    setSettings(copyFields(newSettings));
  }

  return <>
    <ConfirmModal
      show={showLeaveModal}
      onCancel={() => setShowLeaveModal(false)}
      onConfirm={handleLeave}>
      Leave the game?
    </ConfirmModal>
    <ConfirmModal
      show={showEndModal}
      onCancel={() => setShowEndModal(false)}
      onConfirm={handleEnd}
      loading={ending}
      loadingText="Ending game...">
      End the game for everyone?
    </ConfirmModal>
    <ConfirmModal
      className="game-settings-modal"
      show={showSettingsModal}
      onCancel={() => setShowSettingsModal(false)}
      onConfirm={handleSaveSettings}
      okText="Save" loadingText="Saving..." loading={savingSettings}>
      <LobbySettingsPanel inGame settings={settings} onChange={refreshSettings} />
    </ConfirmModal>

    <div className="menu-row">
      <div className="menu-row-left">
        <CustomDropdown toggle={
          <InlineButton className="menu-player-counter" title="Players">
            <IconCounter icon={<IconPersonInlineSmall />} count={activePlayers.length} />
          </InlineButton>
        }>
          <Dropdown.Menu>
            <GamePlayerList />
          </Dropdown.Menu>
        </CustomDropdown>
        <TurnCounter />
      </div>

      <div className="menu-row-right">
        <CustomDropdown toggle={
          <InlineButton title="Scores" style={{ whiteSpace: "nowrap" }}>
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
              <PlayerAvatar player={player} />
              <span className="player-name">
                {player.name}{isSpectator && " (spectator)"}
                {isJudge && <Twemoji className="icon-czar">👑</Twemoji>}
              </span>
            </span>
          } toggleClassName="game-menu-icon">
          <Dropdown.Menu>
            <MenuItem label="Leave" onClick={() => setShowLeaveModal(true)} />
            <MenuItem label="Settings" onClick={openSettings} locked={!canControlLobby} />
            <MenuItem label="End game" onClick={() => setShowEndModal(true)} locked={!canControlLobby} />
          </Dropdown.Menu>
        </CustomDropdown>
      </div>
    </div>
  </>;
}


interface MenuItemProps {
  label: string,
  locked?: boolean,
  onClick?: () => void,
}

function MenuItem({ label, onClick, locked }: MenuItemProps) {
  const { isJudge } = useGameContext();
  return (
    <Dropdown.Item
      onClick={onClick}
      disabled={locked && !isJudge}>
      {locked && !isJudge ? (
        // Only current judge can click this. Show an icon on the right.
        <span className="menu-item-locked" >{label}
          <Twemoji className="lock-icon" >👑</Twemoji></span>
      ) : label}
    </Dropdown.Item>
  );
}

/** Shows current turn number and total turns. */
function TurnCounter() {
  const { lobby, turn } = useGameContext();
  let total: ReactNode = "";
  switch (lobby.settings.play_until) {
    case "forever":
      total = " / ∞";
      break;
    case "max_turns":
    case "max_turns_per_person":
      total = ` / ${lobby.settings.max_turns}`;
      break;
    case "max_score":
      total = <> – until {lobby.settings.max_score}<IconStarInline/></>;
      break;
  }
  return <span className="menu-turn-ordinal">Turn {turn.ordinal}{total}</span>;
}