import { Fragment, useState } from 'react';
import { GameButton } from '../../../components/Buttons';
import { Checkbox } from '../../../components/Checkbox';
import {
  IconChevronDownInline,
  IconChevronUpInline,
} from '../../../components/Icons';
import { PlayerAvatar } from '../../../components/PlayerAvatar';
import { UserMergeMap, UserStats } from '@shared/types';
import { mergeUserStats } from '../../../api/stats-api';
import { ScrollContainer } from '../../../components/layout/ScrollContainer';
import { Accordion, AccordionItem } from '../../../components/Accordion';
import { UserMergeMapTable } from './UserMergeMapTable';

/**
 * Formats milliseconds into a human-readable time string (e.g., "2h 30m")
 */
function formatPlayTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '<1m';
  }
}

function formatDate(date: Date | undefined) {
  if (!date) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface UserStatsTableProps {
  stats: UserStats[];
  userMergeMap: UserMergeMap;
  onMergeMapChange: (newMergeMap: UserMergeMap) => void;
}

export function UserStatsTable({
  stats,
  userMergeMap,
  onMergeMapChange,
}: UserStatsTableProps) {
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const toggleUserSelection = (uid: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(uid)) {
      newSelection.delete(uid);
    } else {
      newSelection.add(uid);
    }
    setSelectedUsers(newSelection);
  };

  const handleMergeUsers = () => {
    if (selectedUsers.size < 2) {
      alert('Please select at least 2 users to merge');
      return;
    }

    const usersToMerge = stats.filter((s) => selectedUsers.has(s.uid));
    const primaryUser = usersToMerge[0];

    const { mergedUids } = mergeUserStats(
      usersToMerge,
      primaryUser.uid,
      primaryUser.name,
    );

    // Update the merge map with the new merge
    const newMergeMap = new UserMergeMap(userMergeMap.entries());
    newMergeMap.set(primaryUser.uid, mergedUids);
    onMergeMapChange(newMergeMap);

    setSelectedUsers(new Set());
    setMergeMode(false);
  };

  const cancelMerge = () => {
    setMergeMode(false);
    setSelectedUsers(new Set());
  };

  if (stats.length === 0) {
    return null;
  }

  return (
    <>
      <Accordion>
        <AccordionItem
          header={
            <div className="stats-table-controls">
              User merge map
              {!mergeMode && (
                <GameButton
                  secondary
                  small
                  inline
                  onClick={(e) => {
                    e.stopPropagation();
                    setMergeMode(true);
                  }}
                >
                  Merge Users
                </GameButton>
              )}
              {mergeMode && (
                <>
                  <GameButton
                    small
                    inline
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMergeUsers();
                    }}
                    disabled={selectedUsers.size < 2}
                  >
                    Merge Selected ({selectedUsers.size})
                  </GameButton>
                  <GameButton
                    small
                    inline
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelMerge();
                    }}
                  >
                    Cancel
                  </GameButton>
                </>
              )}
            </div>
          }
        >
          <UserMergeMapTable map={userMergeMap} />
        </AccordionItem>
      </Accordion>

      <ScrollContainer scrollLight className="user-stats-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>First Played</th>
              <th>Last Played</th>
              <th>Games</th>
              <th>Turns</th>
              <th>Wins</th>
              <th>Win Rate</th>
              <th>Avg Score</th>
              <th>Med Score</th>
              <th>Likes</th>
              <th>Discards</th>
              <th>Time Played</th>
              <th>Avg Time</th>
              <th>Med Time</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <Fragment key={stat.uid}>
                <tr
                  className={selectedUsers.has(stat.uid) ? 'selected' : ''}
                  onClick={() => mergeMode && toggleUserSelection(stat.uid)}
                >
                  <td className="control-cell">
                    <div className="group">
                      <GameButton
                        inline
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedUser(
                            expandedUser === stat.uid ? null : stat.uid,
                          );
                        }}
                      >
                        {expandedUser === stat.uid ? (
                          <IconChevronUpInline />
                        ) : (
                          <IconChevronDownInline />
                        )}
                      </GameButton>
                      {mergeMode && (
                        <Checkbox
                          checked={selectedUsers.has(stat.uid)}
                          onChange={() => toggleUserSelection(stat.uid)}
                        />
                      )}
                    </div>
                  </td>
                  <PlayerNameCell stat={stat} />
                  <td className="col-date">
                    {stat.first_time_played
                      ? formatDate(new Date(stat.first_time_played))
                      : '-'}
                  </td>
                  <td className="col-date">
                    {stat.last_time_played
                      ? formatDate(new Date(stat.last_time_played))
                      : '-'}
                  </td>
                  <CounterRow val={stat.total_games} />
                  <CounterRow val={stat.total_turns_played} />
                  <CounterRow val={stat.total_wins} />
                  <CounterRow val={`${(stat.win_rate * 100).toFixed(1)}%`} />
                  <CounterRow val={stat.average_score_per_game.toFixed(1)} />
                  <CounterRow val={stat.median_score_per_game.toFixed(1)} />
                  <CounterRow val={stat.total_likes_received} />
                  <CounterRow val={stat.total_discards} />
                  <CounterRow val={formatPlayTime(stat.total_time_played_ms)} />
                  <CounterRow
                    val={formatPlayTime(stat.average_time_per_game_ms)}
                  />
                  <CounterRow
                    val={formatPlayTime(stat.median_time_per_game_ms)}
                  />
                </tr>
                {expandedUser === stat.uid && (
                  <tr className="detail-row">
                    <td></td>
                    <td colSpan={9}>
                      <UserStatsDetails stat={stat} />
                    </td>
                    <td colSpan={6}></td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </ScrollContainer>
    </>
  );
}

function CounterRow({ val }: { val: number | string }) {
  const classes = new Array<string>();
  classes.push('col-counter');
  if (val === 0) classes.push('empty');
  return <td className={classes.join(' ')}>{val}</td>;
}

function PlayerNameCell({ stat }: { stat: UserStats }) {
  const player = stat.player_in_lobby_refs.at(-1);
  const names = Array.from(
    new Set(stat.player_in_lobby_refs.map((p) => p.name)),
  );
  if (!player) return <i>Unknown</i>;
  return (
    <td>
      <div className="player-name">
        <PlayerAvatar player={player} />
        {names.join(', ')}
      </div>
    </td>
  );
}

function UserStatsDetails({ stat }: { stat: UserStats }) {
  // Get top months
  const topMonths = Array.from(stat.games_per_month.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="user-stats-details">
      <div className="detail-section">
        <h4>UIDs</h4>
        <p>
          {Array.from(
            new Set(stat.player_in_lobby_refs.map((p) => p.uid)),
          ).join(', ')}
        </p>
      </div>

      {topMonths.length > 0 && (
        <div className="detail-section">
          <h4>Most Active Months</h4>
          <ul>
            {topMonths.map(([month, count]) => (
              <li key={month}>
                {month}: {count} games
              </li>
            ))}
          </ul>
        </div>
      )}

      {stat.top_cards_played.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Cards Used</h4>
          <ul>
            {stat.top_cards_played.map((item, idx) => (
              <li key={idx}>
                {item.card.content} ({item.count}x)
              </li>
            ))}
          </ul>
        </div>
      )}

      {stat.top_liked_responses.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Liked Responses (normalized)</h4>
          <ul>
            {stat.top_liked_responses.map((item, idx) => (
              <li key={idx}>
                {item.cards.map((c) => c.content).join(' / ')} (
                {(item.normalized_likes * 100).toFixed(0)}% of{' '}
                {item.lobby_size - 1} players)
              </li>
            ))}
          </ul>
        </div>
      )}

      {stat.top_teammates.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Teammates</h4>
          <ul>
            {stat.top_teammates.map((teammate) => (
              <li key={teammate.uid}>
                {teammate.name} ({teammate.games} games)
              </li>
            ))}
          </ul>
        </div>
      )}

      {stat.top_prompts_played.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Prompts Chosen (as Czar)</h4>
          <ul>
            {stat.top_prompts_played.map((item, idx) => (
              <li key={idx}>
                {item.prompt.content} ({item.count}x)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
