import { User } from "firebase/auth";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { GameLobby } from "../../shared/types";
import { useNavigate } from "react-router-dom";
import { GameButton } from "../../components/Buttons";
import { CSSProperties, useContext, useEffect } from "react";
import { useScores } from "../../model/lobby-api";
import { ErrorContext } from "../../components/ErrorContext";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Delay } from "../../components/Delay";

interface Props {
  lobby: GameLobby,
  user: User,
}

const midRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  gap: "1rem",
  overflowY: "auto",
  width: "100vw",
  maxHeight: "70vh",
}

const botRowStyle: CSSProperties = {
  position: "relative",
  marginTop: "2rem",
  height: "3rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
}

export function ScoreboardScreen({ lobby, user }: Props) {
  const navigate = useNavigate();
  const [scores, loading, error] = useScores(lobby.id);
  const { setError } = useContext(ErrorContext);
  useEffect(() => { if (error) setError(error); }, [error, setError]);

  return <CenteredLayout className="scoreboard-screen">
    {(!scores || loading) ? <LoadingSpinner delay text="Loading scoreboard..." /> : (<>
      <h2>Scoreboard</h2>
      <div style={midRowStyle} className="miniscrollbar miniscrollbar-light">
        <table className="table scoreboard-table">
          <thead>
            <tr>
              {/* <th></th> */}
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {scores.map(({ player, score }) => <tr key={player.uid}>
              {/* Don't show scores: */}
              {/* <th>{i + 1}</th> */}
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
    <div style={botRowStyle}>
      <Delay>
        <GameButton secondary onClick={() => navigate("/")}>Go home</GameButton>
      </Delay>
    </div>
  </CenteredLayout>;
}