import { CSSProperties, useState } from "react";
import { GameLobby } from "../shared/types";
import { DeckSelector } from "./DeckSelector";
import play_button from '../assets/play_button.svg'
import { startLobby } from "../model/lobby-api";
import { LoadingSpinner } from "./utils";

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
  minWidth: "10em",
  display: "flex",
  textAlign: "center",
  paddingLeft: "0.9em",
  alignItems: "center",
};

export function LobbyCreatorControls({ lobby }: Props) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  if (error) throw error;
  async function handleStart() {
    setStarting(true);
    try {
    await startLobby(lobby);
    } catch (e: any) {
      setError(e);
    }
  }
  if (starting) return <LoadingSpinner text="Starting..."/>;
  return <>
    <h3 style={headerStyle}>Select decks</h3>
    <DeckSelector lobby={lobby} />
    <div style={footerStyle}>
      <button style={startButtonStyle} className="accent-button start-button"
        onClick={handleStart}
        disabled={lobby.deck_ids.size == 0}>
        <img src={play_button} />
        <span style={{ flexGrow: 1 }}>Start</span>
      </button>
    </div>
  </>;
}