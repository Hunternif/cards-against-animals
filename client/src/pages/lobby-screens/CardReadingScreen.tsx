import { User } from "@firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { PromptCard } from "../../components/Cards";
import { ResponseReading } from "../../components/ResponseReading";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { revealPlayerResponse, useAllPlayerResponses } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerResponse, ResponseCardInGame } from "../../shared/types";
import { ErrorContext } from "../../components/ErrorContext";
import { GameButton } from "../../components/Buttons";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
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

// const dummyCard = new ResponseCardInGame("deck1_01", "deck1", "01", 123, "Poop", 0);
// const dummyResponse = new PlayerResponse("01", "Dummy", [dummyCard, dummyCard], 123, true);
// const dummyResponses = new Array<PlayerResponse>(10).fill(dummyResponse, 0, 10);

export function CardReadingScreen({ lobby, turn, user }: TurnProps) {
  // const responses = dummyResponses;
  const [responses] = useAllPlayerResponses(lobby, turn);
  const [winner, setWinner] = useState<PlayerResponse | null>(null);
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;
  const allRevealed = responses?.every((r) => r.revealed) ?? false;

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

  return <CenteredLayout>
    <div style={topRowStyle}>
      {isJudge && <>
        <h2 className="dim">
          {allRevealed ? "Select winner:" : "Click to reveal answers:"}
        </h2>
        {winner && <GameButton accent>Confirm</GameButton>}
      </>}
    </div>
    <div style={midRowStyle}>
      <PromptCard card={turn.prompt} />
      {responses && responses.sort((r) => r.random_index).map((r) =>
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
  </CenteredLayout>;
}
