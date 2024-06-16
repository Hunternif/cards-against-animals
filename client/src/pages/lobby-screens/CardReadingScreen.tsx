import { useContext, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { ErrorContext } from "../../components/ErrorContext";
import { GameLayout } from "../../components/layout/GameLayout";
import { chooseWinner, startNewTurn } from "../../api/turn-control-api";
import { PlayerResponse } from "../../shared/types";
import { CardOffsetContextProvider } from "./game-components/CardOffsetContext";
import { CardPromptWithCzar } from "./game-components/CardPrompt";
import { useGameContext } from "./game-components/GameContext";
import { ResponseReading } from "./game-components/ResponseReading";
import { assertExhaustive } from "../../shared/utils";
import { revealPlayerResponse } from "../../api/turn-response-api";
import { toggleLikeResponse } from "../../api/turn-like-api";


// const dummyCard = new ResponseCardInGame("deck1_01", "deck1", "01", 123, "Poop", 0);
// const dummyResponse = new PlayerResponse("01", "Dummy", [dummyCard, dummyCard], 123, true);
// const dummyResponses = new Array<PlayerResponse>(10).fill(dummyResponse, 0, 10);

export function CardReadingScreen() {
  // const responses = dummyResponses;
  const { lobby, turn, player, isJudge, prompt, responses, players } = useGameContext();
  const [winner, setWinner] = useState<PlayerResponse | null>(null);
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const { setError } = useContext(ErrorContext);
  const allRevealed = responses.every((r) => r.reveal_count >= r.cards.length) ?? false;
  const noResponses = responses.length === 0;
  const shuffledResponses = responses.sort((r1, r2) => r1.random_index - r2.random_index);
  const isActivePlayer = player.role === "player";

  const settings = lobby.settings;
  let showLikes = false;
  if (settings.enable_likes) {
    switch (settings.show_likes_to) {
      case "all": showLikes = true; break;
      case "all_except_czar": showLikes = !isJudge; break;
      default: assertExhaustive(settings.show_likes_to);
    }
  }

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
        .catch((e: any) => setError(e));
    }
  }

  async function handleConfirm() {
    // confirm winner
    if (winner) {
      try {
        await chooseWinner(lobby, turn, winner.player_uid);
      } catch (e: any) {
        setError(e);
      }
    }
  }

  async function handleSkipTurn() {
    setStartingNewTurn(true);
    await startNewTurn(lobby, turn)
      .catch((e: any) => {
        setError(e);
        setStartingNewTurn(false);
      });
  }

  /** When a player toggles "like" on the response */
  async function handleLike(response: PlayerResponse) {
    await toggleLikeResponse(lobby, turn, response, responses, player)
      .catch((e: any) => setError(e));
  }

  return <GameLayout className="card-reading-screen reading-layout-container">
    <header className="reading-control-row">
      {isJudge && <>
        <h2 className="dim">
          {noResponses ? "No responses :(" :
            allRevealed ? "Select winner:" : "Click to reveal answers:"}
        </h2>
        {winner &&
          <GameButton accent onClick={handleConfirm}>Confirm</GameButton>}
      </>}
    </header>
    <section className="reading-main-row">
      <CardPromptWithCzar card={prompt}
        canVote={isActivePlayer && !isJudge} />
      {/* Add context to share offsets between responses */}
      <CardOffsetContextProvider>
        {shuffledResponses.map((r) =>
          <ResponseReading
            key={r.player_uid}
            player={players.find((p) => p.uid === r.player_uid)}
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
      </CardOffsetContextProvider>
    </section>
    <footer>
      {noResponses && <>
        <GameButton accent onClick={handleSkipTurn}
          disabled={startingNewTurn}>
          Next turn
        </GameButton>
      </>}
    </footer>
  </GameLayout>;
}
