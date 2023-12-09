import { User } from "firebase/auth";
import { Card } from "react-bootstrap";
import { usePlayers } from "../model/lobby-api";
import { FillLayout } from "./layout/FillLayout";
import { LoadingSpinner } from "./utils";
import { GameLobby, PlayerInLobby } from "../shared/types";

interface ListProps {
  lobby: GameLobby,
  user: User,
}

// TODO: set maximum players in lobby settings.
const maxPlayers = 20;
const slots = Array<PlayerSlot>(maxPlayers).fill("empty", 0, maxPlayers);
type PlayerSlot = PlayerInLobby | "empty";

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
      }}>{player.name}</Card.Body>
    </Card>
  );
}

/** List of players in the lobby */
export function LobbyPlayerList({ lobby, user }: ListProps) {
  const [players, loadingPlayers] = usePlayers(lobby.id);
  if (loadingPlayers) return <FillLayout><LoadingSpinner /></FillLayout>;
  return (
    <ul style={{ padding: 0, margin: 0 }}>
      {slots.map((_, i) => <li key={i} style={{
        listStyleType: "none",
      }}>
        {players && players[i] ?
          <PlayerCard player={players[i]}
            isMe={user.uid === players[i].uid}
          /> :
          <EmptyCard />
        }
      </li>
      )}
    </ul >
  );
}