import { CSSProperties, useContext, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { CardPromptWithCzar } from "../../components/CardPrompt";
import { ErrorContext } from "../../components/ErrorContext";
import { useGameContext } from "../../components/GameContext";
import { ResponseReading } from "../../components/ResponseReading";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { chooseWinner, revealPlayerResponse, startNewTurn, toggleLikeResponse } from "../../model/turn-api";
import { PlayerResponse } from "../../shared/types";

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

export function CardReadingScreen() {
  // const responses = dummyResponses;
  const { lobby, turn, player, isJudge, prompt, responses } = useGameContext();
  const [winner, setWinner] = useState<PlayerResponse | null>(null);
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const { setError } = useContext(ErrorContext);
  const allRevealed = responses.every((r) => r.revealed) ?? false;
  const noResponses = responses.length === 0;
  const shuffledResponses = responses.sort((r1, r2) => r1.random_index - r2.random_index);
  const isActivePlayer = player.role === "player";

  const settings = lobby.settings;
  const showLikes = settings.enable_likes &&
    (!isJudge || settings.show_likes_to !== "all_except_czar");

  async function handleClick(response: PlayerResponse) {
    if (allRevealed) {
      // clicking to toggle winner
      if (winner?.player_uid === response.player_uid) {
        setWinner(null);
      } else {
        setWinner(response);
      }
    } else {
      // clicking to reveal:
      await revealPlayerResponse(lobby, turn, response.player_uid)
        .catch((e) => setError(e));
    }
  }

  async function handleConfirm() {
    // confirm winner
    if (winner) {
      try {
        await chooseWinner(lobby, turn, winner.player_uid);
      } catch (e) {
        setError(e);
      }
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

  /** When a player toggles "like" on the response */
  async function handleLike(response: PlayerResponse) {
    await toggleLikeResponse(lobby, turn, response, responses, player)
      .catch((e) => setError(e));
  }

  return <CenteredLayout innerClassName="reading-layout-container">
    <div style={topRowStyle} className="reading-control-row">
      {isJudge && <>
        <h2 className="dim">
          {noResponses ? "No responses :(" :
            allRevealed ? "Select winner:" : "Click to reveal answers:"}
        </h2>
        {winner &&
          <GameButton accent onClick={handleConfirm}>Confirm</GameButton>}
      </>}
    </div>
    <div style={midRowStyle} className="reading-main-row">
      <CardPromptWithCzar card={prompt}
        canVote={isActivePlayer && !isJudge} />
      {shuffledResponses.map((r) =>
        <ResponseReading
          key={r.player_uid}
          response={r}
          canReveal={isJudge}
          canSelect={isJudge && allRevealed}
          selected={winner?.player_uid === r.player_uid}
          onClick={(r) => handleClick(r)}
          showLikes={showLikes}
          canLike={!isJudge && r.player_uid !== player.uid && lobby.settings.enable_likes}
          onClickLike={(r) => handleLike(r)}
        />
      )}
    </div>
    <div style={botRowStyle}>
      {noResponses && <>
        <GameButton accent onClick={handleSkipTurn}
          disabled={startingNewTurn}>
          Next turn
        </GameButton>
      </>}
    </div>
  </CenteredLayout>;
}
