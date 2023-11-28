import { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { lobbiesRef, useGameTurns } from "../firebase";
import { GameLobby } from "../model/types";

interface LobbyProps {
  lobby: GameLobby;
}

function LobbyData({ lobby }: LobbyProps) {
  const [shouldFetchTurns, setShouldFetchTurns] = useState(false);
  return <div>
    <h3>{lobby.id}</h3>
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
        <TurnsData lobby={lobby} />
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

function TurnsData({ lobby }: LobbyProps) {
  const [turns] = useGameTurns(lobby);
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
      <LobbyData lobby={doc.data()} key={doc.id} />
    )}
  </div>;
}