import { Accordion } from "react-bootstrap";
import { useCollection } from "react-firebase-hooks/firestore";
import { lobbiesRef } from "../../firebase";
import { usePlayers } from "../../model/lobby-api";
import { useAllPlayerDataOnce, useAllPlayerResponsesOnce, useAllTurnsOnce, usePlayerHandOnce } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerDataInTurn, PlayerResponse } from "../../shared/types";

interface LobbyProps {
  lobby: GameLobby;
}

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
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
  const [turns] = useAllTurnsOnce(lobby);
  const sortedTurns = turns && turns.sort((t1, t2) =>
    t1.time_created?.getSeconds() - t2.time_created?.getSeconds());
  return <>
    {sortedTurns && sortedTurns.map((turn) =>
      <TurnData lobby={lobby} turn={turn} key={turn.id} />
    )}
  </>;
}

function TurnData({ lobby, turn }: TurnProps) {
  const [playerData] = useAllPlayerDataOnce(lobby, turn);
  const [playerResponses] = useAllPlayerResponsesOnce(lobby, turn);
  return <div>
    <div>{turn.id}: {turn.prompt?.content}</div>
    <ul>
      {playerData && playerData.map((pdata, i) =>
        <PlayerInTurnData key={i} lobby={lobby} turn={turn} data={pdata}
          responses={playerResponses} />
      )}
    </ul>
  </div>;
}

interface PlayerProps {
  lobby: GameLobby,
  turn: GameTurn,
  data: PlayerDataInTurn,
  responses?: PlayerResponse[],
}
function PlayerInTurnData({ lobby, turn, data, responses }: PlayerProps) {
  const [hand] = usePlayerHandOnce(lobby, turn, data.player_uid);
  const played = responses?.find((r) => r.player_uid === data.player_uid)
    ?.cards?.map((card) => card.content).join(', ') ?? null;
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