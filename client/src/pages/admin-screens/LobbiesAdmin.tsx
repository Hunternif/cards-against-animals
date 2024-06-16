import { useCollection } from "react-firebase-hooks/firestore";
import { usePlayers } from "../../api/lobby-hooks";
import { lobbiesRef } from "../../api/lobby-repository";
import {
  useAllPlayerDataOnce,
  useAllPlayerResponsesOnce,
  useAllTurnPrompts,
  useAllTurnsOnce,
  usePlayerHandOnce,
} from "../../api/turn-hooks";
import { Accordion, AccordionItem } from "../../components/Accordion";
import {
  GameLobby,
  GameTurn,
  PlayerDataInTurn,
  PlayerResponse,
} from "../../shared/types";
import { AdminSubpage } from "./admin-components/AdminSubpage";

interface LobbyProps {
  lobby: GameLobby;
}

interface TurnProps {
  lobby: GameLobby;
  turn: GameTurn;
}

function LobbyData({ lobby }: LobbyProps) {
  return (
    <AccordionItem key={lobby.id} header={lobby.id}>
      <ul>
        <div className="data-subsection">
          <li>Creator: {lobby.creator_uid}</li>
          <li>Created: {lobby.time_created?.toLocaleDateString() ?? "-"}</li>
          <li>Status: {lobby.status}</li>
        </div>
        <PlayersData lobby={lobby} />
      </ul>
      <AccordionItem header="Turns">
        <TurnsData lobby={lobby} />
      </AccordionItem>
    </AccordionItem>
  );
}

function PlayersData({ lobby }: LobbyProps) {
  const [players] = usePlayers(lobby.id);
  return (
    <>
      <b>Players: </b>
      {players && players.map((p) => p.name).join(", ")}
    </>
  );
}

function TurnsData({ lobby }: LobbyProps) {
  const [turns] = useAllTurnsOnce(lobby);
  const sortedTurns =
    turns &&
    turns.sort(
      (t1, t2) => t1.time_created?.getSeconds() - t2.time_created?.getSeconds(),
    );
  return (
    <>
      {sortedTurns &&
        sortedTurns.map((turn) => (
          <TurnData lobby={lobby} turn={turn} key={turn.id} />
        ))}
    </>
  );
}

function TurnData({ lobby, turn }: TurnProps) {
  const [playerData] = useAllPlayerDataOnce(lobby, turn);
  const [playerResponses] = useAllPlayerResponsesOnce(lobby, turn);
  const [prompts] = useAllTurnPrompts(lobby, turn);
  return (
    <div>
      <div>
        {turn.id}: {prompts?.at(0)?.content}
      </div>
      <ul>
        {playerData &&
          playerData.map((pdata) => (
            <PlayerInTurnData
              key={pdata.player_uid}
              lobby={lobby}
              turn={turn}
              data={pdata}
              responses={playerResponses}
            />
          ))}
      </ul>
    </div>
  );
}

interface PlayerProps {
  lobby: GameLobby;
  turn: GameTurn;
  data: PlayerDataInTurn;
  responses?: PlayerResponse[];
}
function PlayerInTurnData({ lobby, turn, data, responses }: PlayerProps) {
  const [hand] = usePlayerHandOnce(lobby, turn.id, data.player_uid);
  const played =
    responses
      ?.find((r) => r.player_uid === data.player_uid)
      ?.cards?.map((card) => card.content)
      .join(", ") ?? null;
  const isJudge = turn.judge_uid == data.player_uid;
  const isWinner = turn.winner_uid == data.player_uid;
  const handStr = hand?.map((c) => c.content).join(", ");
  return (
    <li key={data.player_uid}>
      {data.player_name}:{isJudge && " 💬 "}
      {isWinner && " 🏆 "}
      {` [${handStr}]`}
      {played && `, played "${played}"`}
    </li>
  );
}

export function LobbiesAdmin() {
  const [lobbies] = useCollection(lobbiesRef);

  return (
    <AdminSubpage title="Lobbies">
      <Accordion>
        {lobbies &&
          lobbies.docs.map((doc) => (
            <LobbyData lobby={doc.data()} key={doc.id} />
          ))}
      </Accordion>
    </AdminSubpage>
  );
}
