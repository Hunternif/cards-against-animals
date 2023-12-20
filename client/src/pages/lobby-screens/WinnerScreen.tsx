import { User } from "@firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { PromptCard } from "../../components/Cards";
import { Delay } from "../../components/Delay";
import { ErrorContext } from "../../components/ErrorContext";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ResponseReading } from "../../components/ResponseReading";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { endLobby } from "../../model/lobby-api";
import { startNewTurn } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

const midRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  // alignItems: "center",
  gap: "1rem",
}

const botRowStyle: CSSProperties = {
  position: "relative",
  marginTop: "1.5rem",
  height: "3rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: "1rem",
}

/** Displays winner of the turn */
export function WinnerScreen({ lobby, turn, user, players, responses }: TurnProps) {
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;
  const winner = players.find((p) => p.uid === turn.winner_uid);

  const winnerResponse = responses.find((r) => r.player_uid === turn.winner_uid);

  async function handleNewTurn() {
    setStartingNewTurn(true);
    await startNewTurn(lobby).catch((e) => {
      setError(e);
      setStartingNewTurn(false);
    });
  }

  async function handleEndGame() {
    setEnding(true);
    await endLobby(lobby).catch((e) => {
      setError(e);
      setEnding(false);
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
        <GameButton accent onClick={handleNewTurn}
          disabled={startingNewTurn || ending}>
          Next turn
        </GameButton>
        <Delay delayMs={1000}>
          <GameButton secondary onClick={handleEndGame}
            disabled={startingNewTurn || ending}>
            End game
          </GameButton>
        </Delay>
      </Delay>}
    </div>
  </CenteredLayout>
}