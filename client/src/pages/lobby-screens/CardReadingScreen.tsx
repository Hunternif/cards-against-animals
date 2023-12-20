import { User } from "@firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { PromptCard } from "../../components/Cards";
import { ErrorContext } from "../../components/ErrorContext";
import { ResponseReading } from "../../components/ResponseReading";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { endLobby } from "../../model/lobby-api";
import { chooseWinner, revealPlayerResponse, startNewTurn } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";
import { Delay } from "../../components/Delay";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

const topRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  gap: "1rem",
  marginBottom: "1rem",
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

// const dummyCard = new ResponseCardInGame("deck1_01", "deck1", "01", 123, "Poop", 0);
// const dummyResponse = new PlayerResponse("01", "Dummy", [dummyCard, dummyCard], 123, true);
// const dummyResponses = new Array<PlayerResponse>(10).fill(dummyResponse, 0, 10);

export function CardReadingScreen({ lobby, turn, user, responses }: TurnProps) {
  // const responses = dummyResponses;
  const [winner, setWinner] = useState<PlayerResponse | null>(null);
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;
  const allRevealed = responses.every((r) => r.revealed) ?? false;
  const noResponses = responses.length === 0;

  async function handleClick(response: PlayerResponse) {
    if (allRevealed) {
      // clicking to select winner
      setWinner(response);
    } else {
      // clicking to reveal:
      await revealPlayerResponse(lobby, turn, response.player_uid)
        .catch((e) => setError(e));
    }
  }

  async function handleConfirm() {
    // confirm winner
    if (winner) {
      await chooseWinner(lobby, turn, winner.player_uid)
        .catch((e) => setError(e));
    }
  }

  async function handleSkipTurn() {
    setStartingNewTurn(true);
    await startNewTurn(lobby)
      .catch((e) => {
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

  return <CenteredLayout>
    <div style={topRowStyle}>
      {isJudge && <>
        <h2 className="dim">
          {noResponses ? "No responses :(" :
            allRevealed ? "Select winner:" : "Click to reveal answers:"}
        </h2>
        {winner &&
          <GameButton accent onClick={handleConfirm}>Confirm</GameButton>}
      </>}
    </div>
    <div style={midRowStyle}>
      <PromptCard card={turn.prompt} />
      {responses.sort((r) => r.random_index).map((r) =>
        <ResponseReading
          key={r.player_uid}
          response={r}
          canReveal={isJudge}
          canSelect={isJudge && allRevealed}
          selected={winner?.player_uid === r.player_uid}
          onClick={(r) => handleClick(r)}
        />
      )}
    </div>
    <div style={botRowStyle}>
      {noResponses && <>
        <GameButton accent onClick={handleSkipTurn}
          disabled={startingNewTurn || ending}>
          Next turn
        </GameButton>
        <Delay delayMs={1000}>
          <GameButton secondary onClick={handleEndGame}
            disabled={startingNewTurn || ending}>
            End game
          </GameButton>
        </Delay>
      </>}
    </div>
  </CenteredLayout>;
}
