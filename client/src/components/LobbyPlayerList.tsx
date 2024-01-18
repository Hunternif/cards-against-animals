import { User } from "firebase/auth";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Card } from "react-bootstrap";
import { GameLobby, PlayerInLobby } from "../shared/types";
import { ErrorContext } from "./ErrorContext";
import { kickPlayer } from "../model/lobby-api";
import { ConfirmModal } from "./ConfirmModal";

interface ListProps {
  lobby: GameLobby,
  user: User,
  players: PlayerInLobby[],
}

function EmptyCard() {
  return (
    <Card className="player-card empty">
      <Card.Body>Empty</Card.Body>
    </Card>
  );
}

interface PlayerProps {
  lobby: GameLobby,
  player: PlayerInLobby,
  isMe?: boolean,
  isCreator?: boolean,
  canKick?: boolean,
}

function PlayerCard({ lobby, player, isMe, isCreator, canKick }: PlayerProps) {
  const { setError } = useContext(ErrorContext);
  const [showKickModal, setShowKickModal] = useState(false);
  async function handleKick() {
    await kickPlayer(lobby, player).catch((e) => setError(e));
    setShowKickModal(false);
  }
  return <>
    <ConfirmModal
      show={showKickModal}
      text="Kick the player out?"
      onCancel={() => setShowKickModal(false)}
      onConfirm={handleKick}
    />
    <Card className="player-card" bg={isMe ? "secondary" : "none"}>
      <Card.Body>
        <span className="player-name">{player.name}</span>
        {isCreator ? <span className="right-icon">👑</span> :
          player.status === "kicked" ? <span className="right-icon">💀</span> :
            canKick && <span className="right-icon kick-button"
              title="Kick player" onClick={() => setShowKickModal(true)} />}
      </Card.Body>
    </Card>
  </>;
}

const initialSlotCount = 6;

/** List of players in the lobby */
export function LobbyPlayerList({ lobby, user, players }: ListProps) {
  const [minSlotCount, setMinSlotCount] = useState(initialSlotCount);
  const [slotCount, setSlotCount] = useState(initialSlotCount);
  const [slots, setSlots] = useState<Array<ReactNode>>([]);
  const ulRef = useRef<HTMLUListElement>(null);

  // Filter out people who left:
  const validPlayers = players.filter((p) => p.status === "online");

  // Update number of slots, so there is always more than players:
  useEffect(() => {
    const newSlotCount = Math.max(minSlotCount, slotCount, validPlayers.length + 2);
    const newSlots = new Array<ReactNode>();
    for (let i = 0; i < newSlotCount; i++) {
      if (validPlayers[i]) {
        newSlots.push(<PlayerCard lobby={lobby} player={validPlayers[i]}
          isMe={user.uid === validPlayers[i].uid}
          isCreator={lobby.creator_uid === validPlayers[i].uid}
          canKick={lobby.creator_uid === user.uid}
        />);
      } else {
        newSlots.push(<EmptyCard />);
      }
    }
    setSlots(newSlots);
    setSlotCount(newSlotCount);
  }, [validPlayers.length, minSlotCount]);

  // Set initial number of slots to fill the entire screen:
  useEffect(() => {
    if (ulRef.current?.parentElement) {
      const containerHeight = ulRef.current.parentElement.clientHeight;
      const emSize = Math.max(12, parseFloat(getComputedStyle(ulRef.current).fontSize));
      const slotHeight = 3 * emSize;
      setMinSlotCount(Math.floor(containerHeight / slotHeight) - 1);
    }
  }, [ulRef]);

  return (
    <ul style={{ padding: 0, margin: 0 }} ref={ulRef}>
      {slots.map((slot, i) =>
        <li key={i} style={{ listStyleType: "none" }}>{slot}</li>
      )}
    </ul >
  );
}