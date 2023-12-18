import { User } from "firebase/auth";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { PromptCard } from "../../components/Cards";
import { ErrorContext } from "../../components/ErrorContext";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { endLobby } from "../../model/lobby-api";
import { discardPrompt, getPromptCount, pickNewPrompt, playPrompt } from "../../model/turn-api";
import { GameLobby, GameTurn, PromptCardInGame } from "../../shared/types";
import { logInteraction } from "../../components/utils";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

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
  marginTop: "1.5rem",
  height: "3rem",
  display: "flex",
  justifyContent: "center",
}

/** Aligned to the right of the centered card */
const sideSectionStyle: CSSProperties = {
  position: "absolute",
  margin: "2rem",
  left: "100%",
}

/** Aligned below the "Change" button */
const countStyle: CSSProperties = {
  position: "absolute",
  top: "3.5rem",
}

export function JudgePickPromptScreen({ lobby, turn }: TurnProps) {
  const [prompt, setPrompt] = useState<PromptCardInGame | null>(null);
  const [cardCount, setCardCount] = useState(-1);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      logInteraction(lobby.id, { viewed: [prompt] });
      await discardPrompt(lobby, prompt)
        .then(() => pickNewPrompt(lobby))
        .then((card) => setPrompt(card))
        .catch((e) => setError(e));
    }
  }

  async function handleSubmit() {
    if (prompt) {
      // This is only called once per card, so we can safely log the impression
      // of the submitted card:
      logInteraction(lobby.id, { viewed: [prompt], played: [prompt] });
      setSubmitted(true);
      await playPrompt(lobby, turn, prompt).catch((e) => {
        setError(e);
        setSubmitted(false);
      });
    }
  }

  useEffect(() => {
    getInitialPrompt().catch((e) => setError(e));
  }, [lobby]);

  useEffect(() => {
    getPromptCount(lobby).then((c) => setCardCount(c));
  }, [lobby, prompt]);

  return <CenteredLayout style={{
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
      ) : prompt ? (<>
        <div style={midRowStyle}>
          <PromptCard card={prompt} />
          <div style={sideSectionStyle}>
            <GameButton secondary small onClick={handleChange}>
              Change
            </GameButton>
            <span style={countStyle} className="extra-dim">
              {cardCount} cards left
            </span>
          </div>
        </div>
        <div style={botRowStyle}>
          <GameButton accent onClick={handleSubmit}
            disabled={!prompt || submitted}>Play</GameButton>
        </div>
      </>) : (
        <CheckDeckCount lobby={lobby} count={cardCount} />
      )}
    </div>
  </CenteredLayout>;
}

interface CountProps {
  lobby: GameLobby,
  count: number,
}

function CheckDeckCount({ lobby, count }: CountProps) {
  const { setError } = useContext(ErrorContext);

  async function handleEndGame() {
    await endLobby(lobby).catch((e) => setError(e));
  }

  return <>
    <div style={midRowStyle}>
      {count > 0 ? `${count} cards remaining` :
        count == 0 ? "No more cards left :(" : ""}
    </div>
    <div style={botRowStyle}>
      {count == 0 && <GameButton onClick={handleEndGame}>End game</GameButton>}
    </div>
  </>
}