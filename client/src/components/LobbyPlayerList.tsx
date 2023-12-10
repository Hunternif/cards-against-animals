import { User } from "firebase/auth";
import { Card } from "react-bootstrap";
import { usePlayers } from "../model/lobby-api";
import { FillLayout } from "./layout/FillLayout";
import { LoadingSpinner } from "./utils";
import { GameLobby, PlayerInLobby } from "../shared/types";
import { ReactNode, useEffect, useState } from "react";

interface ListProps {
  lobby: GameLobby,
  user: User,
}

function EmptyCard() {
  return (
    <Card style={{
      margin: "0.5em 0",
      borderStyle: "dashed",
      backgroundColor: "#00000000",
    }}>
      <Card.Body style={{
        padding: "0.5em 1em",
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
        padding: "0.5em 1em",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        display: "flex",
      }}>
        <span>{player.name}</span>
        {isCreator && <span style={{ marginLeft: "auto" }}>👑</span>}
      </Card.Body>
    </Card>
  );
}

const initialSlotCount = 6;

/** List of players in the lobby */
export function LobbyPlayerList({ lobby, user }: ListProps) {
  const [players, loadingPlayers] = usePlayers(lobby.id);
  const [slotCount, setSlotCount] = useState(initialSlotCount);
  const [slots, setSlots] = useState<Array<ReactNode>>([]);

  useEffect(() => {
    if (players) {
      const newSlotCount = Math.max(slotCount, players.length + 2);
      const newSlots = new Array<ReactNode>();
      for (let i = 0; i < newSlotCount; i++) {
        if (players && players[i]) {
          newSlots.push(<PlayerCard player={players[i]}
            isMe={user.uid === players[i].uid}
            isCreator={lobby.creator_uid === players[i].uid}
          />);
        } else {
          newSlots.push(<EmptyCard />);
        }
      }
      setSlots(newSlots);
      setSlotCount(newSlotCount);
    }
  }, [players?.length]);

  if (loadingPlayers) return <FillLayout><LoadingSpinner /></FillLayout>;

  return (
    <ul style={{ padding: 0, margin: 0 }}>
      {slots.map((slot, i) =>
        <li key={i} style={{ listStyleType: "none" }}>{slot}</li>
      )}
    </ul >
  );
}