import { User } from "firebase/auth";
import { useState, useEffect, useContext } from "react";
import { GameButton } from "../../components/Buttons";
import { PromptCard } from "../../components/Cards";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { pickNewPrompt, playPrompt } from "../../model/turn-api";
import { GameLobby, GameTurn, PromptCardInGame } from "../../shared/types";
import { ErrorContext } from "../../components/ErrorContext";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

export function JudgePickPromptScreen({ lobby, turn, user }: TurnProps) {
  const [prompt, setPrompt] = useState<PromptCardInGame | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { setError } = useContext(ErrorContext);
  async function newPrompt() {
    setPrompt(await pickNewPrompt(lobby));
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
    <PromptCard card={prompt} />
    <GameButton accent style={{ marginTop: "1.5rem" }} onClick={handleSubmit}
      disabled={!prompt || submitted}>Play</GameButton>
  </CenteredLayout>;
}