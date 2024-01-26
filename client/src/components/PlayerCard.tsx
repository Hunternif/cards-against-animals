import { useContext, useState } from "react";
import { Card } from "react-bootstrap";
import { kickPlayer } from "../model/lobby-api";
import { GameLobby, PlayerInLobby } from "../shared/types";
import { ConfirmModal } from "./ConfirmModal";
import { ErrorContext } from "./ErrorContext";
import { Twemoji } from "./Twemoji";

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

  async function handleKick() {
    setKicking(true);
    try {
      await kickPlayer(lobby, player)
      setShowKickModal(false);
    } catch (e) {
      setError(e);
    }
    finally {
      setKicking(false);
    }
  }

  return <>
    <ConfirmModal
      show={showKickModal}
      onCancel={() => setShowKickModal(false)}
      onConfirm={handleKick}
      loading={kicking}>
      Kick {player.name} out?
    </ConfirmModal>
    <Card className={`player-card ${meStyle} ${judgeStyle}`}>
      <Card.Body>
        <span className="player-name">{player.name}</span>
        {(isCreator || isJudge) ? <Twemoji className="right-icon">👑</Twemoji> :
          player.status === "kicked" ? <Twemoji className="right-icon">💀</Twemoji> :
            canKick && <span className="right-icon kick-button"
              title="Kick player" onClick={() => setShowKickModal(true)} />}
      </Card.Body>
    </Card>
  </>;
}

export function EmptyPlayerCard() {
  return (
    <Card className="player-card empty">
      <Card.Body>Empty</Card.Body>
    </Card>
  );
}