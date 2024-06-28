import { useCollection } from 'react-firebase-hooks/firestore';
import { usePlayers } from '../../api/lobby/lobby-hooks';
import { lobbiesRef } from '../../api/lobby/lobby-repository';
import {
  useAllPlayerResponsesOnce,
  useAllTurnPrompts,
  useAllTurnsOnce,
} from '../../api/turn/turn-hooks';
import { Accordion, AccordionItem } from '../../components/Accordion';
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PlayerResponse,
} from '../../shared/types';
import { AdminSubpage } from './admin-components/AdminSubpage';

interface LobbyProps {
  lobby: GameLobby;
}

interface InLobbyProps {
  lobby: GameLobby;
  players: PlayerInLobby[];
}

interface TurnProps {
  lobby: GameLobby;
  turn: GameTurn;
  players: PlayerInLobby[];
}

function LobbyData({ lobby }: LobbyProps) {
  const [players] = usePlayers(lobby.id);
  return (
    <AccordionItem key={lobby.id} header={lobby.id}>
      <ul>
        <div className="data-subsection">
          <li>Creator: {lobby.creator_uid}</li>
          <li>Created: {lobby.time_created?.toLocaleDateString() ?? '-'}</li>
          <li>Status: {lobby.status}</li>
        </div>
        <PlayersData lobby={lobby} players={players ?? []} />
      </ul>
      <AccordionItem header="Turns">
        <TurnsData lobby={lobby} players={players ?? []} />
      </AccordionItem>
    </AccordionItem>
  );
}

function PlayersData({ players }: InLobbyProps) {
  return (
    <>
      <b>Players: </b>
      {players && players.map((p) => p.name).join(', ')}
    </>
  );
}

function TurnsData({ lobby, players }: InLobbyProps) {
  const [turns] = useAllTurnsOnce(lobby);
  const sortedTurns =
    turns &&
    turns.sort(
      (t1, t2) => t1.time_created?.getTime() - t2.time_created?.getTime(),
    );
  return (
    <>
      {sortedTurns &&
        sortedTurns.map((turn) => (
          <TurnData lobby={lobby} turn={turn} key={turn.id} players={players} />
        ))}
    </>
  );
}

function TurnData({ lobby, turn, players }: TurnProps) {
  const [playerResponses] = useAllPlayerResponsesOnce(lobby, turn);
  const [prompts] = useAllTurnPrompts(lobby, turn);
  return (
    <div>
      <div>
        {turn.id}: {prompts?.at(0)?.content}
      </div>
      <ul>
        {players.map((player) => (
          <PlayerInTurnData
            key={player.uid}
            turn={turn}
            player={player}
            responses={playerResponses}
          />
        ))}
      </ul>
    </div>
  );
}

interface PlayerProps {
  turn: GameTurn;
  player: PlayerInLobby;
  responses?: PlayerResponse[];
}
function PlayerInTurnData({ turn, player, responses }: PlayerProps) {
  const played =
    responses
      ?.find((r) => r.player_uid === player.uid)
      ?.cards?.map((card) => card.content)
      .join(', ') ?? null;
  const isJudge = turn.judge_uid == player.uid;
  const isWinner = turn.winner_uid == player.uid;
  return (
    <li key={player.uid}>
      {player.name}:{isJudge && ' 💬 '}
      {isWinner && ' 🏆 '}
      {played && `, played "${played}"`}
    </li>
  );
}

export function AdminLobbiesPage() {
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
