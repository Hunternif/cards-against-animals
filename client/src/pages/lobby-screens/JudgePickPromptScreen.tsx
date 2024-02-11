import { CSSProperties, useContext, useEffect, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { ErrorContext } from "../../components/ErrorContext";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { GameLayout } from "../../components/layout/GameLayout";
import { logInteraction } from "../../components/utils";
import { endLobby } from "../../model/lobby-api";
import { discardPrompt, getPromptCount, pickNewPrompt, playPrompt } from "../../model/turn-api";
import { PromptCardInGame } from "../../shared/types";
import { CardPrompt } from "./game-components/CardPrompt";
import { useGameContext } from "./game-components/GameContext";


export function JudgePickPromptScreen() {
  const { lobby, turn } = useGameContext();
  const [prompt, setPrompt] = useState<PromptCardInGame | null>(null);
  const [cardCount, setCardCount] = useState(-1);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function getInitialPrompt() {
    await (pickNewPrompt(lobby))
      .then((card) => {
        setPrompt(card);
        setInitialLoaded(true);
      })
      .catch((e) => setError(e));
  }

  async function handleChange() {
    if (prompt) {
      // This is only called once per card, so we can safely log the impression
      // of the previous card, because we will never see it again:
      logInteraction(lobby.id, { viewed: [prompt], discarded: [prompt] });
      await discardPrompt(lobby, prompt)
        .then(() => pickNewPrompt(lobby))
        .then((card) => setPrompt(card))
        .catch((e) => setError(e));
    }
  }

  async function handleSubmit() {
    if (prompt) {
      // "Played" interaction will be logged on the server.
      setSubmitted(true);
      await playPrompt(lobby, turn, prompt).catch((e) => {
        setError(e);
        setSubmitted(false);
      });
    }
  }

  async function handleEndGame() {
    setEnding(true);
    await endLobby(lobby).catch((e) => {
      setError(e);
      setEnding(false);
    });
  }

  // Load the initial prompt when the screen loads:
  useEffect(() => {
    if (!prompt) {
      getInitialPrompt().catch((e) => setError(e));
    }
  }, [lobby, prompt, getInitialPrompt, setError]);

  useEffect(() => {
    getPromptCount(lobby).then((c) => setCardCount(c));
  }, [lobby, prompt]);

  return <GameLayout className="pick-prompt-screen">
    <header>
      <h2 className="dim">
        You are <i>Card Czar</i>! Pick a card:
      </h2>
    </header>
    <section>
      {!initialLoaded ? (
        <LoadingSpinner delay text="Loading deck..." />
      ) : <>
        {prompt ? (
          <>
            <div className="column-left" />
            <div className="column-center">
              <CardPrompt card={prompt} />
            </div>
            <div className="column-right controls">
              {cardCount > 1 ? (<>
                <GameButton secondary small onClick={handleChange}>
                  Change
                </GameButton>
                <span className="extra-dim card-counter">
                  {cardCount} cards left
                </span>
              </>) : (
                <span className="extra-dim" style={{ whiteSpace: "nowrap" }}>
                  Last card
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            {cardCount > 0 ? `Oops! ${cardCount} cards remaining, but couldn't load any` :
              cardCount == 0 ? "No more cards left :(" : ""}
          </>
        )}
      </>}
    </section>
    <footer>
      {prompt ? (
        <GameButton accent onClick={handleSubmit} className="play-button"
          disabled={!prompt || submitted || ending}>Play</GameButton>
      ) : (
        <>
          {cardCount == 0 &&
            <GameButton onClick={handleEndGame} disabled={ending}>
              End game
            </GameButton>}
        </>
      )}
    </footer>
  </GameLayout>;
}