import { User } from "firebase/auth";
import { useState, useEffect, useContext, CSSProperties } from "react";
import { GameButton } from "../../components/Buttons";
import { PromptCard } from "../../components/Cards";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { discardPrompt, pickNewPrompt, playPrompt } from "../../model/turn-api";
import { GameLobby, GameTurn, PromptCardInGame } from "../../shared/types";
import { ErrorContext } from "../../components/ErrorContext";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

const midRowStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
}

/** Aligned to the right of the centered card */
const changeButtonStyle: CSSProperties = {
  position: "absolute",
  margin: "2rem",
  left: "100%",
}

export function JudgePickPromptScreen({ lobby, turn, user }: TurnProps) {
  const [prompt, setPrompt] = useState<PromptCardInGame | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function newPrompt() {
    await (pickNewPrompt(lobby))
      .then((card) => setPrompt(card))
      .catch((e) => setError(e));
  }

  async function handleChange() {
    if (prompt) {
      await discardPrompt(lobby, prompt)
        .then(() => pickNewPrompt(lobby))
        .then((card) => setPrompt(card))
        .catch((e) => setError(e));
    }
  }

  async function handleSubmit() {
    if (prompt) {
      setSubmitted(true);
      await playPrompt(lobby, turn, prompt).catch((e) => {
        setError(e);
        setSubmitted(false);
      });
    }
  }

  useEffect(() => {
    newPrompt().catch((e) => setError(e));
  }, [lobby]);

  return <CenteredLayout style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }}>
    <h2 style={{ textAlign: "center" }}>Pick a card</h2>
    <div style={midRowStyle}>
      <PromptCard card={prompt} />
      <GameButton secondary style={changeButtonStyle} onClick={handleChange}>
        Change
      </GameButton>
    </div>
    <GameButton accent style={{ marginTop: "1.5rem" }} onClick={handleSubmit}
      disabled={!prompt || submitted}>Play</GameButton>
  </CenteredLayout>;
}