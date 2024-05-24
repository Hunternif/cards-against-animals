import { PlayerCard } from "../lobby-components/PlayerCard";
import { useGameContext } from "./GameContext";

/**
 * List of players in the game.
 * Slightly different from the list in the lobby:
 * - ordered by play sequence,
 * - no empty slots
 * - highlights current judge
 */
export function GamePlayerList() {
  const { lobby, user, players, judge, canControlLobby } = useGameContext();
  // Filter out people who left, order by play sequence:
  const playerSequence = players
    .filter((p) => p.role === "player" && p.status !== "left")
    .sort((a, b) => a.random_index - b.random_index);
  const judgeIndex = playerSequence
    .findIndex((p) => judge.uid === p.uid) + 1;

  return (
    <div className="game-player-list">
      <h4 className="title">Player {judgeIndex}/{playerSequence.length}</h4>
      <ul style={{ padding: 0, margin: 0 }}>
        {playerSequence.map((player) =>
          <li key={player.uid} style={{ listStyleType: "none" }}>
            <PlayerCard
              lobby={lobby}
              player={player}
              isMe={user.uid === player.uid}
              isJudge={judge.uid === player.uid}
              canKick={canControlLobby}
            />
          </li>
        )}
      </ul >
    </div>
  );
}