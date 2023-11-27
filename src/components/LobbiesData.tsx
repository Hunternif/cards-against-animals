import { useCollection } from "react-firebase-hooks/firestore";
import { lobbiesRef } from "../firebase";
import { GameLobby } from "../model/types";

interface LobbyProps {
  id: string;
  lobby: GameLobby;
}

function LobbyData({ id, lobby }: LobbyProps) {
  return <div>
    <h3>{id}</h3>
    <ul>
      <li>Key: {lobby.lobby_key}</li>
      <li>Created: {new Date(lobby.time_created).toLocaleDateString()}</li>
      <div className="data-subsection">
        <h4>Players:</h4>
        <ul>
          {lobby.players.map((player) =>
            <li key={player.name}>{player.name}</li>
          )}
        </ul>
      </div>
    </ul>
  </div>
}

export function LobbiesData() {
  const [lobbies] = useCollection(lobbiesRef);

  return <div className="data-section">
    <h2>Lobbies</h2>
    {lobbies && lobbies.docs.map((doc) =>
      <LobbyData id={doc.id} lobby={doc.data()} key={doc.id} />
    )}
  </div>;
}