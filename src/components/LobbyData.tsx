import { useCollection } from "react-firebase-hooks/firestore";
import { lobbiesRef } from "../firebase";

export function LobbyData() {
  const [lobbies] = useCollection(lobbiesRef);

  return <div className="data-section">
    <h2>Lobbies</h2>
    {lobbies && lobbies.docs.map((doc) => {
      const lobby = doc.data();
      return <div key={doc.id}>
        <h3>{doc.id}</h3>
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
    })}
  </div>;
}