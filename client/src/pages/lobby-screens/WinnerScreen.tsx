import { User } from "@firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { CardPromptWithCzar } from "../../components/CardPrompt";
import { Delay } from "../../components/Delay";
import { ErrorContext } from "../../components/ErrorContext";
import { ResponseReading } from "../../components/ResponseReading";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { startNewTurn } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  judge?: PlayerInLobby,
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
export function WinnerScreen(
  { lobby, turn, user, judge, players, responses }: TurnProps
) {
  const [startingNewTurn, setStartingNewTurn] = useState(false);
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

  return <CenteredLayout>
    <h2 style={{ textAlign: "center" }}>
      {winner ? <>Winner <i>{winner.name}</i></> :
        <Delay>No winner</Delay>}
    </h2>
    <div style={midRowStyle}>
      <CardPromptWithCzar card={turn.prompt} judge={isJudge ? null : judge} />
      {winnerResponse && <ResponseReading response={winnerResponse} />}
    </div>
    <div style={botRowStyle}>
      {isJudge && <Delay>
        <GameButton accent onClick={handleNewTurn}
          disabled={startingNewTurn}>
          Next turn
        </GameButton>
      </Delay>}
    </div>
  </CenteredLayout>
}