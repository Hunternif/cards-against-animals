import { DocumentReference, QueryDocumentSnapshot, collection } from "firebase/firestore";
import { useState } from "react";
import { useCollection, useCollectionData } from "react-firebase-hooks/firestore";
import { lobbiesRef, useGameTurns } from "../firebase";
import { GameLobby, GameTurn } from "../model/types";
import { playerDataConverter } from "../model/firebase-converters";
import { Accordion } from "react-bootstrap";

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
          <li>Created: {new Date(lobby.time_created).toLocaleDateString()}</li>
        </div>
        <b>Players: </b>
        {lobby.players.map((p) => p.name).join(', ')}
      </ul>
      <Accordion>
        <Accordion.Header>Turns</Accordion.Header>
        <Accordion.Body> <TurnsData lobby={lobby} /></Accordion.Body>
      </Accordion>
    </Accordion.Body>
  </Accordion.Item>;
}

function TurnsData({ lobby }: LobbyProps) {
  const [turns] = useGameTurns(lobby);
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
    <Accordion>
      {lobbies && lobbies.docs.map((doc) =>
        <LobbyData lobby={doc.data()} key={doc.id} />
      )}
    </Accordion>
  </div>;
}