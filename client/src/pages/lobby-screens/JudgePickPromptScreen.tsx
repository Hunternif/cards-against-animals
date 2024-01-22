import { CSSProperties, useContext, useEffect, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { CardPrompt } from "../../components/CardPrompt";
import { ErrorContext } from "../../components/ErrorContext";
import { useGameContext } from "../../components/GameContext";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { logInteraction } from "../../components/utils";
import { endLobby } from "../../model/lobby-api";
import { discardPrompt, getPromptCount, pickNewPrompt, playPrompt } from "../../model/turn-api";
import { PromptCardInGame } from "../../shared/types";

const containerStyle: CSSProperties = {
  height: "20rem",
}

const midRowStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  height: "14rem",
}

const botRowStyle: CSSProperties = {
  position: "relative",
  marginTop: "1.5rem",
  height: "3rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
  gap: "1rem",
}

/** Aligned to the right of the centered card */
const sideSectionStyle: CSSProperties = {
  position: "absolute",
  marginLeft: "2rem",
  left: "100%",
}

/** Aligned below the "Change" button */
const countStyle: CSSProperties = {
  position: "absolute",
  top: "3.5rem",
}

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

  useEffect(() => {
    getInitialPrompt().catch((e) => setError(e));
  }, [lobby, getInitialPrompt, setError]);

  useEffect(() => {
    getPromptCount(lobby).then((c) => setCardCount(c));
  }, [lobby, prompt]);

  return <CenteredLayout innerStyle={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }}>
    <h2 style={{ textAlign: "center" }} className="dim">
      You are <i>Card Czar</i>! Pick a card:
    </h2>
    {/* Fixed-size container to prevent layout shift during loading */}
    <div style={containerStyle}>
      {!initialLoaded ? (
        <LoadingSpinner delay text="Loading deck..." />
      ) : <>
        <div style={midRowStyle}>
          {prompt ? (
            <>
              <CardPrompt card={prompt} />
              <div style={sideSectionStyle}>
                {cardCount > 1 ? (<>
                  <GameButton secondary small onClick={handleChange}>
                    Change
                  </GameButton>
                  <span style={countStyle} className="extra-dim">
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
        </div>
        <div style={botRowStyle}>
          {prompt ? (
            <GameButton accent onClick={handleSubmit}
              disabled={!prompt || submitted || ending}>Play</GameButton>
          ) : (
            <>
              {cardCount == 0 &&
                <GameButton onClick={handleEndGame} disabled={ending}>
                  End game
                </GameButton>}
            </>
          )}
        </div>
      </>}
    </div>
  </CenteredLayout>;
}