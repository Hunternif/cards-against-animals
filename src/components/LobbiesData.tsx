import { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { lobbiesRef, useGameTurns } from "../firebase";
import { GameLobby } from "../model/types";

interface LobbyProps {
  id: string;
  lobby: GameLobby;
}

function LobbyData({ id, lobby }: LobbyProps) {
  const [shouldFetchTurns, setShouldFetchTurns] = useState(false);
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
      {shouldFetchTurns ? (
        <TurnsData id={id} lobby={lobby} />
      ) : (
        <p>
          <button onClick={() => setShouldFetchTurns(true)}>
            Fetch turns
          </button>
        </p>
      )}
    </ul>
  </div >;
}

function TurnsData({ id }: LobbyProps) {
  const [turns] = useGameTurns(id);
  return <div className="data-subsection">
    <h4>Turns:</h4>
    {turns && turns.docs.map((doc) => 
      <div key={doc.id}>
        <span>{doc.id}. Judge: {doc.data().judge_name}</span>
      </div>
    )}
  </div>;
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