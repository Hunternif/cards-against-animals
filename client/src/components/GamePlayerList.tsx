import { User } from "firebase/auth";
import { GameLobby, GameTurn, PlayerInLobby } from "../shared/types";
import { PlayerCard } from "./PlayerCard";

interface PlayerListProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  players: PlayerInLobby[],
}

/**
 * List of players in the game.
 * Slightly different from the list in the lobby:
 * - ordered by play sequence,
 * - no empty slots
 * - highlights current judge
 */
export function GamePlayerList({ lobby, turn, user, players }: PlayerListProps) {
  // Filter out people who left, order by play sequence:
  const playerSequence = players
    .filter((p) => p.role === "player" && p.status !== "left")
    .sort((a, b) => a.random_index - b.random_index);
  const judgeIndex = playerSequence
    .findIndex((p) => turn.judge_uid === p.uid) + 1;

  return (
    <div className="game-player-list">
      <h4 className="title">Player {judgeIndex}/{playerSequence.length}</h4>
      <ul style={{ padding: 0, margin: 0 }}>
        {playerSequence.map((player, i) =>
          <li key={i} style={{ listStyleType: "none" }}>
            <PlayerCard
              lobby={lobby}
              player={player}
              isMe={user.uid === player.uid}
              isJudge={turn.judge_uid === player.uid}
              canKick={turn.judge_uid === user.uid}
            />
          </li>
        )}
      </ul >
    </div>
  );
}