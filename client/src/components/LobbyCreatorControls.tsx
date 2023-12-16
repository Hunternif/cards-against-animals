import { CSSProperties, useContext, useState } from "react";
import { GameLobby } from "../shared/types";
import { DeckSelector } from "./DeckSelector";
import { startLobby } from "../model/lobby-api";
import { LoadingSpinner } from "./utils";
import { GameButton } from "./Buttons";
import { ErrorContext } from "./ErrorContext";
import { IconPlay } from "./Icons";

interface Props {
  lobby: GameLobby,
}

const headerStyle: CSSProperties = {
  textAlign: "center",
}

const footerStyle: CSSProperties = {
  margin: "2em 0",
  width: "100%",
  display: "flex",
  justifyContent: "center",
};

const startButtonStyle: CSSProperties = {
  minWidth: "10rem",
};

export function LobbyCreatorControls({ lobby }: Props) {
  const [starting, setStarting] = useState(false);
  const { setError } = useContext(ErrorContext);
  async function handleStart() {
    setStarting(true);
    try {
      await startLobby(lobby);
    } catch (e: any) {
      setError(e);
      setStarting(false);
    }
  }
  if (starting) return <LoadingSpinner text="Starting..." />;
  return <>
    <h3 style={headerStyle}>Select decks</h3>
    <DeckSelector lobby={lobby} />
    <div style={footerStyle}>
      <GameButton accent style={startButtonStyle} className="start-button"
        onClick={handleStart}
        disabled={lobby.deck_ids.size == 0}
        icon={<IconPlay />}>
        Start
      </GameButton>
    </div>
  </>;
}