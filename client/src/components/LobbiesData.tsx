import { DocumentReference, collection } from "firebase/firestore";
import { Accordion } from "react-bootstrap";
import { useCollection, useCollectionData } from "react-firebase-hooks/firestore";
import { lobbiesRef } from "../firebase";
import { playerConverter, playerDataConverter, turnConverter } from "../model/firebase-converters";
import { GameLobby, GameTurn } from "../shared/types";

interface LobbyProps {
  lobby: GameLobby;
}

interface TurnProps {
  turn: GameTurn,
  turnRef: DocumentReference<GameTurn>;
}

function LobbyData({ lobby }: LobbyProps) {
  return <Accordion.Item eventKey={lobby.id}>
    <Accordion.Header>{lobby.id}</Accordion.Header>
    <Accordion.Body>
      <ul>
        <div className="data-subsection">
          <li>Key: {lobby.lobby_key}</li>
          <li>Creator: {lobby.creator_uid}</li>
          <li>Created: {lobby.time_created ? new Date(lobby.time_created).toLocaleDateString() : '-'}</li>
          <li>Status: {lobby.status}</li>
        </div>
        <PlayersData lobby={lobby} />
      </ul>
      <Accordion>
        <Accordion.Header>Turns</Accordion.Header>
        <Accordion.Body> <TurnsData lobby={lobby} /></Accordion.Body>
      </Accordion>
    </Accordion.Body>
  </Accordion.Item>;
}

function PlayersData({ lobby }: LobbyProps) {
  const [players] = useCollectionData(
    collection(lobbiesRef, lobby.id, 'players')
      .withConverter(playerConverter)
  );
  return <>
    <b>Players: </b>
    {players && players.map((p) => p.name).join(', ')}
  </>;
}

function TurnsData({ lobby }: LobbyProps) {
  const [turns] = useCollection(
    collection(lobbiesRef, lobby.id, 'turns')
      .withConverter(turnConverter)
  );
  return <>
    {turns && turns.docs.map((doc) =>
      <TurnData turn={doc.data()} turnRef={doc.ref} key={doc.id} />
    )}
  </>;
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
        const isJudge = turn.judge_uid == pdata.player_uid;
        const isWinner = turn.winner_uid == pdata.player_uid;
        const hand = pdata.hand.map((c) => c.content).join(', ');
        const played = pdata.current_play?.map((c) => c.content).join(', ');
        return <li key={i}>
          {pdata.player_name}:
          {isJudge && " 💬 "}
          {isWinner && " 🏆 "}
          {` [${hand}]`}
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
    <Accordion>
      {lobbies && lobbies.docs.map((doc) =>
        <LobbyData lobby={doc.data()} key={doc.id} />
      )}
    </Accordion>
  </div>;
}