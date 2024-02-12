import { useContext, useEffect, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { ErrorContext } from "../../components/ErrorContext";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { GameLayout } from "../../components/layout/GameLayout";
import { logInteraction } from "../../components/utils";
import { haikuPrompt } from "../../model/deck-api";
import { endLobby } from "../../model/lobby-api";
import { discardPrompts, getPromptCount, pickNewPrompts, playPrompt } from "../../model/turn-api";
import { PromptCardInGame } from "../../shared/types";
import { CardPrompt } from "./game-components/CardPrompt";
import { useGameContext } from "./game-components/GameContext";


export function JudgePickPromptScreen() {
  const { lobby, turn } = useGameContext();
  const [prompts, setPrompts] = useState<PromptCardInGame[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptCardInGame | null>(null);
  const [cardCount, setCardCount] = useState(-1);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);
  const isHaiku = prompts.length === 1 && prompts[0].id === haikuPrompt.id;

  async function getInitialPrompts() {
    await (pickNewPrompts(lobby))
      .then((cards) => {
        setPrompts(cards);
        setInitialLoaded(true);
      })
      .catch((e) => setError(e));
  }

  async function handleChange() {
    if (isHaiku) {
      await getInitialPrompts();
    } else if (prompts.length > 0) {
      // This is only called once per card, so we can safely log the impression
      // of the previous card, because we will never see it again:
      logInteraction(lobby.id, { viewed: prompts, discarded: prompts });
      await discardPrompts(lobby, prompts)
        .then(() => pickNewPrompts(lobby))
        .then((cards) => setPrompts(cards))
        .catch((e) => setError(e));
    }
  }

  async function handlePlayHaiku() {
    if (!isHaiku) {
      setPrompts([haikuPrompt]);
      setSelectedPrompt(haikuPrompt);
    } else {
      setSelectedPrompt(null);
      await getInitialPrompts();
    }
  }

  async function handleSubmit() {
    if (selectedPrompt) {
      // "Played" interaction will be logged on the server.
      setSubmitted(true);
      await playPrompt(lobby, turn, selectedPrompt).catch((e) => {
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
    if (prompts.length === 0) {
      getInitialPrompts().catch((e) => setError(e));
    }
  }, [lobby, prompts, getInitialPrompts, setError]);

  useEffect(() => {
    getPromptCount(lobby).then((c) => setCardCount(c));
  }, [lobby, prompts]);

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
        {prompts.length > 0 ? (
          <>
            <div className="column-left" />
            <div className="column-center prompts-container">
              {prompts.map((card) =>
                <CardPrompt card={card}
                  canSelect={prompts.length > 1}
                  selected={prompts.length > 1 && selectedPrompt?.id === card.id}
                  onClick={() => setSelectedPrompt(card)} />
              )}
            </div>
            <div className="column-right controls">
              {cardCount > 1 ? (<>
                <GameButton secondary small onClick={handlePlayHaiku}
                  className="haiku-button" title="Play a haiku prompt with 3 phrases."
                  iconRight={!isHaiku && <span className="prompt-pick-number-light">3</span>}>
                  {!isHaiku ? "Play Haiku" : "Cancel haiku"}
                </GameButton>
                <GameButton secondary small onClick={handleChange}
                  title="Discard these prompts and get a new set.">
                  Change cards...
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
      {prompts.length > 0 ? (
        <GameButton accent onClick={handleSubmit} className="play-button"
          disabled={!selectedPrompt || submitted || ending}>Play</GameButton>
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