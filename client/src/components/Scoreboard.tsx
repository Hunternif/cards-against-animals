import { CSSProperties, useContext, useEffect } from "react";
import { useScores } from "../model/lobby-api";
import { GameLobby } from "../shared/types";
import { ErrorContext } from "./ErrorContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface Props {
  lobby: GameLobby,
}

const tableContainerStyle: CSSProperties = {
  display: "flex",
  overflowY: "auto",
  maxHeight: "70vh",
}

/** Small component that is placed outside of the screen. */
export function Scoreboard({ lobby }: Props) {
  const [scores, loading, error] = useScores(lobby.id);
  const { setError } = useContext(ErrorContext);
  useEffect(() => { if (error) setError(error); }, [error, setError]);

  return <>
    {(!scores || loading) ? <LoadingSpinner delay text="Loading scoreboard..." /> : (<>
      <div style={tableContainerStyle} className="miniscrollbar miniscrollbar-light">
        <table className="table scoreboard-table">
          <tbody>
            {scores.map(({ player, score }) => <tr key={player.uid}>
              <td className="sb-col-score">
                {score > 0 && `⭐ ${score}`}
                {/* {"⭐".repeat(score)} */}
              </td>
              <td className="sb-col-name">{player.name}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </>)}
  </>;
}