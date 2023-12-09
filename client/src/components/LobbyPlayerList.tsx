import { User } from "firebase/auth";
import { Card } from "react-bootstrap";
import { usePlayers } from "../model/lobby-api";
import { FillLayout } from "./layout/FillLayout";
import { LoadingSpinner } from "./utils";
import { GameLobby } from "../shared/types";

interface Props {
  lobby: GameLobby,
  user: User,
}

/** List of players in the lobby */
export function LobbyPlayerList({ lobby, user }: Props) {
  const [players, loadingPlayers] = usePlayers(lobby.id);
  if (loadingPlayers) return <FillLayout><LoadingSpinner /></FillLayout>;
  return (
    <ul style={{ padding: 0, margin: 0 }}>
      {players && players.map((p) =>
        <li key={p.uid} style={{
          listStyleType: "none",
        }}>
          <Card style={{ margin: "0.5em 0" }}
            bg={user.uid === p.uid ? "secondary" : "none"}
          >
            <Card.Body style={{ padding: "0.5em 1em" }}>{p.name}</Card.Body>
          </Card>
        </li>
      )}
    </ul>
  );
}