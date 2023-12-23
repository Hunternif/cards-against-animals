import { User } from "firebase/auth";
import { ReactNode, useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { GameLobby, PlayerInLobby } from "../shared/types";

interface ListProps {
  lobby: GameLobby,
  user: User,
  players: PlayerInLobby[],
}

function EmptyCard() {
  return (
    <Card style={{
      margin: "0.5em 0",
      borderStyle: "dashed",
      backgroundColor: "#00000000",
    }}>
      <Card.Body style={{
        padding: "0.5em 0.8em",
        opacity: "50%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      }}>Empty</Card.Body>
    </Card>
  );
}

interface PlayerProps {
  player: PlayerInLobby,
  isMe?: boolean,
  isCreator?: boolean,
}

function PlayerCard({ player, isMe, isCreator }: PlayerProps) {
  return (
    <Card style={{ margin: "0.5em 0" }}
      bg={isMe ? "secondary" : "none"}
    >
      <Card.Body style={{
        padding: "0.5em 0.8em",
        overflow: "hidden",
        whiteSpace: "nowrap",
        display: "flex",
      }}>
        <span style={{
          flexGrow: 1,
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}>{player.name}</span>
        {isCreator && <span style={{
          marginLeft: "auto",
          marginRight: "-0.2em",
        }}>👑</span>}
      </Card.Body>
    </Card>
  );
}

const initialSlotCount = 6;

/** List of players in the lobby */
export function LobbyPlayerList({ lobby, user, players }: ListProps) {
  const [slotCount, setSlotCount] = useState(initialSlotCount);
  const [slots, setSlots] = useState<Array<ReactNode>>([]);
  // Filter out people who left:
  const validPlayers = players.filter((p) => p.status !== "left");

  useEffect(() => {
    const newSlotCount = Math.max(slotCount, validPlayers.length + 2);
    const newSlots = new Array<ReactNode>();
    for (let i = 0; i < newSlotCount; i++) {
      if (validPlayers[i]) {
        newSlots.push(<PlayerCard player={validPlayers[i]}
          isMe={user.uid === validPlayers[i].uid}
          isCreator={lobby.creator_uid === validPlayers[i].uid}
        />);
      } else {
        newSlots.push(<EmptyCard />);
      }
    }
    setSlots(newSlots);
    setSlotCount(newSlotCount);
  }, [validPlayers.length]);

  return (
    <ul style={{ padding: 0, margin: 0 }}>
      {slots.map((slot, i) =>
        <li key={i} style={{ listStyleType: "none" }}>{slot}</li>
      )}
    </ul >
  );
}