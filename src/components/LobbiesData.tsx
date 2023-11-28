import { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { lobbiesRef, useGameTurns } from "../firebase";
import { GameLobby, GameTurn } from "../model/types";

interface LobbyProps {
  lobby: GameLobby;
}

interface TurnProps {
  turn: GameTurn;
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
      <TurnData turn={doc.data()} key={doc.id} />
    )}
  </div>;
}

function TurnData({ turn }: TurnProps) {
  return <div>
    <div>{turn.id}: {turn.question}</div>
    <ul>
      <li> Judge: {turn.judge_name}
        {turn.winning_answer && <span>
          , winner: {turn.winning_answer.player_name}</span>}
      </li>
      {Array.from(turn.player_hands.values(), (hand) => {
        const played = turn.player_answers.get(hand.player_name);
        return <li key={hand.player_name}>
          {hand.player_name}: [{hand.hand_answers.join(', ')}]
          {played && <span>, played: "{played.answer.join(', ')}"</span>}
        </li>
      })}
    </ul>
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