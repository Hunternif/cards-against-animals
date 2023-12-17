import { User } from "@firebase/auth";
import { GameLobby, GameTurn } from "../../shared/types";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { usePlayers } from "../../model/lobby-api";
import { Delay, LoadingSpinner } from "../../components/LoadingSpinner";
import { CSSProperties, useContext, useState } from "react";
import { PromptCard } from "../../components/Cards";
import { ResponseReading } from "../../components/ResponseReading";
import { startNewTurn, useAllPlayerResponses } from "../../model/turn-api";
import { GameButton } from "../../components/Buttons";
import { ErrorContext } from "../../components/ErrorContext";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

const midRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  // alignItems: "center",
  gap: "1rem",
}

const botRowStyle: CSSProperties = {
  marginTop: "1.5rem",
  height: "3rem",
  display: "flex",
  justifyContent: "center",
}

/** Displays winner of the turn */
export function WinnerScreen({ lobby, turn, user }: TurnProps) {
  const [players] = usePlayers(lobby.id);
  const [responses] = useAllPlayerResponses(lobby, turn);
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;
  const winner = players && players.find((p) => p.uid === turn.winner_uid);

  const winnerResponse = responses &&
    responses.find((r) => r.player_uid === turn.winner_uid);

  async function handleNewTurn() {
    setStartingNewTurn(true);
    await startNewTurn(lobby).catch((e) => {
      setError(e);
      setStartingNewTurn(false);
    });
  }

  if (!winner) return <LoadingSpinner delay text="Loading..." />

  return <CenteredLayout>
    <h2 style={{ textAlign: "center" }}>Winner <i>{winner.name}</i></h2>
    <div style={midRowStyle}>
      <PromptCard card={turn.prompt} />
      {winnerResponse && <ResponseReading response={winnerResponse} />}
    </div>
    <div style={botRowStyle}>
      {isJudge && <Delay>
        <GameButton accent onClick={handleNewTurn} disabled={startingNewTurn}>
          Next turn
        </GameButton>
      </Delay>}
    </div>
  </CenteredLayout>
}