import { useGameContext } from "./GameContext";

export function ResponseCount() {
  const { responses, activePlayers, judge } = useGameContext();
  // Filter out the judge:
  const validPlayers = activePlayers.filter((p) => p.uid !== judge.uid);

  return <div className="response-count-container">
    <div className="response-count-header">Players</div>
    <div className="response-count-group">
      <span className="count-current">{responses.length}</span>
      <span className="slash">/</span>
      <span className="count-total">{validPlayers.length}</span>
    </div>
  </div>;
}