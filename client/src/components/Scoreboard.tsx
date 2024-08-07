import { CSSProperties, useEffect, useState } from 'react';
import { getAllPlayersStates } from '../api/lobby/lobby-player-api';
import { GameLobby, PlayerGameState, PlayerInLobby } from '../shared/types';
import { IconHeartInline, IconStarInline } from './Icons';
import { PlayerAvatar } from './PlayerAvatar';

interface Props {
  lobby: GameLobby;
  players: PlayerInLobby[];
}

type PlayerWithState = PlayerInLobby & PlayerGameState;

const tableContainerStyle: CSSProperties = {
  display: 'flex',
  overflowY: 'auto',
  maxHeight: '70vh',
};

/** Reusable scoreboard table component. */
export function Scoreboard({ lobby, players }: Props) {
  const [playerStates, setPlayerStates] = useState<PlayerGameState[]>([]);
  
  // Because Bootstrap renders the dropdown component even when it's invisible,
  // we need to fetch this data every new turn:
  // TODO: get rid of Bootstrap.
  useEffect(() => {
    async function updatePlayerStates() {
      setPlayerStates(await getAllPlayersStates(lobby.id));
    }
    updatePlayerStates();
  }, [lobby.current_turn_id]);

  const playerStateMap = new Map<string, PlayerGameState>(
    playerStates?.map((p) => [p.uid, p]),
  );
  const playersWithState: PlayerWithState[] = players.map((p) =>
    Object.assign({}, p, playerStateMap.get(p.uid)),
  );

  const playersByScore = playersWithState
    .filter(
      (p) =>
        (p.role === 'player' &&
          // Show people who left, but only if they have > 0 score:
          p.status !== 'left') ||
        p.score > 0,
    )
    .sort((a, b) => (b.score - a.score) * 10000 + (b.likes - a.likes));
  const showLikes = lobby.settings.enable_likes;

  return (
    <>
      <div
        style={tableContainerStyle}
        className="miniscrollbar miniscrollbar-light"
      >
        <table className="table scoreboard-table">
          <tbody>
            {playersByScore.map((player) => (
              <tr key={player.uid}>
                <td className="sb-col-score">
                  <IconStarInline /> {player.score}
                  {/* {"⭐".repeat(score)} */}
                </td>
                <td className="sb-col-name">
                  <PlayerAvatar player={player} />
                  <span className="player-name">{player.name}</span>
                </td>
                {showLikes && (
                  <td className="sb-col-score">
                    {player.likes > 0 && (
                      <>
                        <IconHeartInline /> {player.likes}
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
