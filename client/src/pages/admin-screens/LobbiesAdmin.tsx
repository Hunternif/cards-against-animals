import { DocumentReference, collection } from "firebase/firestore";
import { Accordion } from "react-bootstrap";
import { useCollection, useCollectionData } from "react-firebase-hooks/firestore";
import { lobbiesRef } from "../../firebase";
import {
  playerDataConverter,
  playerResponseConverter,
  responseCardInGameConverter,
  turnConverter
} from "../../model/firebase-converters";
import { GameLobby, GameTurn, PlayerDataInTurn, PlayerResponse } from "../../shared/types";
import { usePlayers } from "../../model/lobby-api";

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
  const [players] = usePlayers(lobby.id);
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
  const [playerResponses] = useCollectionData(
    collection(turnRef, 'player_responses')
      .withConverter(playerResponseConverter)
  );
  function findResponse(playerUID: string): string | null {
    if (!playerResponses) return null;
    return playerResponses.find((r) => r.player_uid === playerUID)
      ?.cards.join(', ') ?? null;
  }
  return <div>
    <div>{turn.id}: {turn.prompt?.content}</div>
    <ul>
      {playerData && playerData.map((pdata, i) =>
        <PlayerInTurnData turn={turn} turnRef={turnRef} data={pdata}
          responses={playerResponses} />
      )}
    </ul>
  </div>;
}

interface PlayerProps {
  turn: GameTurn,
  turnRef: DocumentReference<GameTurn>;
  data: PlayerDataInTurn,
  responses?: PlayerResponse[],
}
function PlayerInTurnData({ turn, turnRef, data, responses }: PlayerProps) {
  const [hand] = useCollectionData(
    collection(turnRef, 'player_data', data.player_uid, 'hand')
      .withConverter(responseCardInGameConverter)
  );
  const played = responses?.find((r) => r.player_uid === data.player_uid)
    ?.cards.join(', ') ?? null;
  const isJudge = turn.judge_uid == data.player_uid;
  const isWinner = turn.winner_uid == data.player_uid;
  const handStr = hand?.map((c) => c.content).join(', ');
  return <li key={data.player_uid}>
    {data.player_name}:
    {isJudge && " 💬 "}
    {isWinner && " 🏆 "}
    {` [${handStr}]`}
    {played && `, played "${played}"`}
  </li>;
}

export function LobbiesAdmin() {
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