import { CSSProperties } from "react";
import { GameLobby, PlayerInLobby } from "../shared/types";
import { IconStarInline } from "./Icons";

interface Props {
  lobby: GameLobby,
  players: PlayerInLobby[],
}

const tableContainerStyle: CSSProperties = {
  display: "flex",
  overflowY: "auto",
  maxHeight: "70vh",
}

/** Small component that is placed outside of the screen. */
export function Scoreboard({ players }: Props) {
  const playersByScore = players.sort((a, b) => b.score - a.score);

  return <>
    <div style={tableContainerStyle} className="miniscrollbar miniscrollbar-light">
      <table className="table scoreboard-table">
        <tbody>
          {playersByScore.map((player) => <tr key={player.uid}>
            <td className="sb-col-score">
              {player.score > 0 && <><IconStarInline /> {player.score}</>}
              {/* {"⭐".repeat(score)} */}
            </td>
            <td className="sb-col-name">{player.name}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </>;
}