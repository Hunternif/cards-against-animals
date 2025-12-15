import { GlobalStats } from '@shared/types';
import { ScrollContainer } from '../../../components/layout/ScrollContainer';

export function AdminGlobalStatsSection({
  globalStats,
}: {
  globalStats: GlobalStats;
}) {
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="global-stats-section">
      <h3>Global</h3>

      <ScrollContainer scrollLight>
        <div className="global-stats-grid">
          <div className="global-stat-card">
            <h4>Overview</h4>
            <ul>
              <li>Total Games: {globalStats.total_games}</li>
              <li>Total Turns: {globalStats.total_turns}</li>
              <li>Unique Players: {globalStats.unique_players}</li>
              <li>
                Total Time Played:{' '}
                {formatTime(globalStats.total_time_played_ms)}
              </li>
              <li>
                Median Time per Game:{' '}
                {formatTime(globalStats.median_time_per_game_ms)}
              </li>
              <li>
                Median Players per Game:{' '}
                {globalStats.median_players_per_game.toFixed(1)}
              </li>
              <li>
                Median Turns per Game:{' '}
                {globalStats.median_turns_per_game.toFixed(1)}
              </li>
            </ul>
          </div>

          {globalStats.top_prompts.length > 0 && (
            <div className="global-stat-card">
              <h4>Top Most Played Prompts</h4>
              <ol>
                {globalStats.top_prompts.map((item, idx) => (
                  <li key={idx}>
                    {item.prompt.content} ({item.count}x)
                  </li>
                ))}
              </ol>
            </div>
          )}

          {globalStats.top_response_cards?.length > 0 && (
            <div className="global-stat-card">
              <h4>Top Most Played Responses</h4>
              <ol>
                {globalStats.top_response_cards?.map((item, idx) => (
                  <li key={idx}>
                    {item.card.content} ({item.count}x)
                  </li>
                ))}
              </ol>
            </div>
          )}

          {globalStats.top_liked_responses?.length > 0 && (
            <div className="global-stat-card">
              <h4>Top Most Liked Responses</h4>
              <ol>
                {globalStats.top_liked_responses?.slice(0, 5)?.map((item, idx) => (
                  <li key={idx}>
                    {item.prompt.content}:{' '}
                    {item.cards.map((c) => c.content).join(' / ')} (
                    {(item.normalized_likes * 100).toFixed(0)}% of{' '}
                    {item.lobby_size - 1})
                  </li>
                ))}
              </ol>
            </div>
          )}

          {globalStats.top_months.length > 0 && (
            <div className="global-stat-card">
              <h4>Top Months by Games Played</h4>
              <ol>
                {globalStats.top_months.map((item, idx) => (
                  <li key={idx}>
                    {item.month}: {item.games} games
                  </li>
                ))}
              </ol>
            </div>
          )}

          {globalStats.top_decks.length > 0 && (
            <div className="global-stat-card">
              <h4>Top Most Used Decks</h4>
              <ol>
                {globalStats.top_decks.map((item, idx) => (
                  <li key={idx}>
                    {item.deck_id}: {item.games} games
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </ScrollContainer>
    </div>
  );
}
