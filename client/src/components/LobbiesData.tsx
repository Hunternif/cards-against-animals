import { DocumentReference, QueryDocumentSnapshot, collection } from "firebase/firestore";
import { useState } from "react";
import { useCollection, useCollectionData } from "react-firebase-hooks/firestore";
import { lobbiesRef, useGameTurns } from "../firebase";
import { GameLobby, GameTurn } from "../model/types";
import { playerDataConverter } from "../model/firebase-converters";

interface LobbyProps {
  lobby: GameLobby;
}

interface TurnProps {
  turn: GameTurn,
  turnRef: DocumentReference<GameTurn>;
}

function LobbyData({ lobby }: LobbyProps) {
  const [shouldFetchTurns, setShouldFetchTurns] = useState(false);
  return <div>
    <h3>{lobby.id}</h3>
    <ul>
      <p className="data-subsection">
        <li>Key: {lobby.lobby_key}</li>
        <li>Created: {new Date(lobby.time_created).toLocaleDateString()}</li>
      </p>
      <b>Players: </b>
      {lobby.players.map((p) => p.name).join(', ')}
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
  return <p className="data-subsection">
    <h5>Turns:</h5>
    {turns && turns.docs.map((doc) =>
      <TurnData turn={doc.data()} turnRef={doc.ref} key={doc.id} />
    )}
  </p>;
}

function TurnData({ turn, turnRef }: TurnProps) {
  const [playerData] = useCollectionData(
    collection(turnRef, 'player_data')
      .withConverter(playerDataConverter)
  );
  return <div>
    <div>{turn.id}: {turn.prompt.content}</div>
    <ul>
      {playerData && playerData.map((pdata, i) => {
        const isJudge = turn.judge_name == pdata.player_name;
        const isWinner = turn.winner_name == pdata.player_name;
        const hand = pdata.hand.map((c) => c.content).join(', ');
        const played = pdata.current_play?.map((c) => c.content).join(', ');
        return <li key={i}>
          {pdata.player_name}:
          {isJudge && " 💬 "}
          {isWinner && " 🏆 "}
          [{hand}]
          {played && `, played "${played}"`}
        </li>;
      }
      )}
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