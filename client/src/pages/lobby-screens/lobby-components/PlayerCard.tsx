import { useContext, useState } from "react";
import { Card } from "react-bootstrap";
import { ErrorContext } from "../../../components/ErrorContext";
import { Modal, ModalBody } from "../../../components/Modal";
import { PlayerAvatar } from "../../../components/PlayerAvatar";
import { Twemoji } from "../../../components/Twemoji";
import { kickPlayer, updatePlayer } from "../../../api/lobby/lobby-player-api";
import { updateUserData } from "../../../api/users-api";
import { GameLobby, KickAction, PlayerInLobby } from "../../../shared/types";
import { AvatarSelector } from "./AvatarSelector";
import { GameButton } from "../../../components/Buttons";

interface PlayerProps {
  lobby: GameLobby,
  player: PlayerInLobby,
  isMe?: boolean,
  isCreator?: boolean,
  isJudge?: boolean,
  canKick?: boolean,
}

/**
 * Renders a pill with player name and some controls.
 * Should be used inside player list, either in lobby or in game.
 */
export function PlayerCard({ lobby, player, isMe, isCreator, isJudge, canKick }: PlayerProps) {
  const { setError } = useContext(ErrorContext);
  const [showKickModal, setShowKickModal] = useState(false);
  const [kicking, setKicking] = useState(false);
  const meStyle = isMe ? "me-card" : "";
  const judgeStyle = isJudge ? "judge-card" : "";

  async function executeKick(action: KickAction) {
    setKicking(true);
    try {
      await kickPlayer(lobby, player, action)
      setShowKickModal(false);
    } catch (e: any) {
      setError(e);
    }
    finally {
      setKicking(false);
    }
  }

  async function handleBan() {
    await executeKick("ban");
  }

  async function handleKick() {
    await executeKick("kick");
  }

  async function setNewAvatar(avatarID: string) {
    try {
      // Update both in the lobby and globally:
      player.avatar_id = avatarID;
      await updatePlayer(lobby.id, player);
      await updateUserData(player.uid, player.name, avatarID);
    } catch (e: any) {
      setError(e);
    }
  }

  return <>
    <Modal show={showKickModal} onHide={() => setShowKickModal(false)}>
      <ModalBody loading={kicking}>Kick {player.name} out?</ModalBody>
      <footer>
        <GameButton onClick={handleBan} accent disabled={kicking}>Ban</GameButton>
        <GameButton onClick={handleKick} disabled={kicking}>Kick</GameButton>
        <GameButton onClick={() => setShowKickModal(false)} disabled={kicking}>Cancel</GameButton>
      </footer>
    </Modal>

    <Card className={`player-card ${meStyle} ${judgeStyle}`}>
      <Card.Body>
        {isMe ? (
          // TODO: the popup is bugged in in-game player list. Don't use dropdown!
          <AvatarSelector inline
            avatarID={player.avatar_id}
            onSubmit={setNewAvatar} />
        ) : (
          <PlayerAvatar player={player} />
        )}
        <span className="player-name">{player.name}</span>
        <span className="right-group">
          {(isCreator || isJudge) &&
            <Twemoji className="right-icon">👑</Twemoji>
          }
          {player.status === "banned" ? (
            <Twemoji className="right-icon">💀</Twemoji>
          ) : (
            canKick && !isMe && <span className="right-icon kick-button"
              title="Kick player" onClick={() => setShowKickModal(true)} />
          )}
        </span>
      </Card.Body>
    </Card>
  </>;
}

export function EmptyPlayerCard() {
  return (
    <Card className="player-card empty">
      <Card.Body>
        <div className="avatar inline-avatar empty-avatar" />
        <span>Empty</span>
      </Card.Body>
    </Card>
  );
}