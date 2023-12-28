import { PlayerInLobby, PlayerResponse } from "../shared/types";

interface Props {
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

export function ResponseCount({ players, responses }: Props) {
  return <div className="response-count-container">
    <div className="response-count-header">Responded</div>
    <div className="response-count-group">
      <span className="count-current">{responses.length}</span>
      <span className="slash">/</span>
      <span className="count-total">{players.length}</span>
    </div>
  </div>;
}