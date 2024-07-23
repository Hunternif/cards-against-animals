import { useContext, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  endLobby,
  updateLobbySettings,
} from '../../../../api/lobby/lobby-control-api';
import { leaveLobby } from '../../../../api/lobby/lobby-join-api';
import {
  setMyPlayerRole,
  updatePlayer,
} from '../../../../api/lobby/lobby-player-api';
import { updateUserData } from '../../../../api/users-api';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { CustomDropdown } from '../../../../components/CustomDropdown';
import { ErrorContext } from '../../../../components/ErrorContext';
import { PlayerAvatar } from '../../../../components/PlayerAvatar';
import { Twemoji } from '../../../../components/Twemoji';
import { LobbySettings } from '../../../../shared/types';
import { copyFields } from '../../../../shared/utils';
import { AvatarSelector } from '../../lobby-components/AvatarSelector';
import { LobbySettingsPanel } from '../../lobby-components/LobbySettingsPanel';
import { useGameContext } from '../GameContext';

/** Dropdown menu showing player */
export function GamePlayerMenu() {
  const navigate = useNavigate();
  const {
    lobby,
    player,
    activePlayers,
    isSpectator,
    isJudge,
    canControlLobby,
  } = useGameContext();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);

  const [newAvatarID, setNewAvatarID] = useState(player.avatar_id);
  const canJoinAsPlayer = activePlayers.length < lobby.settings.max_players;

  // Make a local copy of settings to make changes:
  const [settings, setSettings] = useState(lobby.settings);
  const [savingSettings, setSavingSettings] = useState(false);

  async function handleLeave() {
    try {
      await leaveLobby(lobby, player.uid);
      navigate('/');
    } catch (e: any) {
      setError(e);
    }
  }

  async function handleEnd() {
    try {
      setEnding(true);
      await endLobby(lobby);
    } catch (e: any) {
      setError(e);
    } finally {
      setEnding(false);
    }
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

  async function handleSaveProfile() {
    try {
      if (newAvatarID) {
        // Update both in the lobby and globally:
        player.avatar_id = newAvatarID;
        await updatePlayer(lobby.id, player);
        await updateUserData(player.uid, player.name, newAvatarID);
        setShowProfileModal(false);
      }
    } catch (e) {
      setError(e);
    }
  }

  async function handleSpectate() {
    try {
      await setMyPlayerRole(lobby.id, 'spectator');
    } catch (e: any) {
      setError(e);
    }
  }

  async function handleJoinAsPlayer() {
    try {
      await setMyPlayerRole(lobby.id, 'player');
    } catch (e: any) {
      setError(e);
    }
  }

  return (
    <>
      <ConfirmModal
        show={showLeaveModal}
        onCancel={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
      >
        Leave the game?
      </ConfirmModal>
      <ConfirmModal
        show={showEndModal}
        onCancel={() => setShowEndModal(false)}
        onConfirm={handleEnd}
        loading={ending}
        loadingText="Ending game..."
      >
        End the game for everyone?
      </ConfirmModal>
      <ConfirmModal
        longFormat
        scroll
        className="game-settings-modal"
        show={showSettingsModal}
        onCancel={() => setShowSettingsModal(false)}
        onConfirm={handleSaveSettings}
        okText="Save"
        loadingText="Saving..."
        loading={savingSettings}
      >
        <LobbySettingsPanel
          inGame
          settings={settings}
          onChange={refreshSettings}
        />
      </ConfirmModal>
      <ConfirmModal
        className="profile-modal"
        show={showProfileModal}
        onConfirm={handleSaveProfile}
        onCancel={() => setShowProfileModal(false)}
        okText="Save"
      >
        <AvatarSelector avatarID={newAvatarID} onSubmit={setNewAvatarID} />
        {/* TODO: allow changing name */}
        <div className="player-name">{player.name}</div>
      </ConfirmModal>

      <CustomDropdown
        showArrow
        toggle={
          <span className="light">
            <PlayerAvatar player={player} />
            <span className="player-name">
              {player.name}
              {isSpectator && ' (spectator)'}
              {isJudge && <Twemoji className="icon-czar">👑</Twemoji>}
            </span>
          </span>
        }
        toggleClassName="game-menu-icon"
      >
        <Dropdown.Menu>
          {!isSpectator && (
            <MenuItem label="Spectate" onClick={handleSpectate} />
          )}
          {isSpectator && (
            <MenuItem
              label="Join as player"
              onClick={handleJoinAsPlayer}
              locked={!canJoinAsPlayer}
            />
          )}
          <MenuItem label="Profile" onClick={() => setShowProfileModal(true)} />
          <MenuItem
            label="Settings"
            onClick={openSettings}
            locked={!canControlLobby}
          />
          <MenuItem label="Leave" onClick={() => setShowLeaveModal(true)} />
          <MenuItem
            label="End game"
            onClick={() => setShowEndModal(true)}
            locked={!canControlLobby}
          />
        </Dropdown.Menu>
      </CustomDropdown>
    </>
  );
}

interface MenuItemProps {
  label: string;
  disabled?: boolean;
  locked?: boolean;
  onClick?: () => void;
}

function MenuItem({ label, onClick, locked, disabled }: MenuItemProps) {
  return (
    <Dropdown.Item onClick={onClick} disabled={disabled || locked}>
      {locked ? (
        // Only current judge can click this. Show an icon on the right.
        <span className="menu-item-locked">
          {label}
          <Twemoji className="lock-icon">👑</Twemoji>
        </span>
      ) : (
        label
      )}
    </Dropdown.Item>
  );
}
