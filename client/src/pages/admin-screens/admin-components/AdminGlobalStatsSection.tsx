import { GlobalStats } from '../../../api/stats-api';

export function AdminGlobalStatsSection({
  globalStats,
}: {
  globalStats: GlobalStats;
}) {
  return (
    <div className="global-stats-section">
      <h3>Global</h3>
      <div className="global-stats-grid">
        {globalStats.top_prompts.length > 0 && (
          <div className="global-stat-card">
            <h4>Top 5 Most Played Prompts</h4>
            <ol>
              {globalStats.top_prompts.map((item, idx) => (
                <li key={idx}>
                  {item.prompt.content} ({item.count}x)
                </li>
              ))}
            </ol>
          </div>
        )}

        {globalStats.top_responses.length > 0 && (
          <div className="global-stat-card">
            <h4>Top 5 Most Played Responses</h4>
            <ol>
              {globalStats.top_responses.map((item, idx) => (
                <li key={idx}>
                  {item.card.content} ({item.count}x)
                </li>
              ))}
            </ol>
          </div>
        )}

        {globalStats.top_months.length > 0 && (
          <div className="global-stat-card">
            <h4>Top 5 Months by Games Played</h4>
            <ol>
              {globalStats.top_months.map((item, idx) => (
                <li key={idx}>
                  {item.month}: {item.games} games
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
