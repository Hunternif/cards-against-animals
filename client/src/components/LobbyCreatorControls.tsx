import { CSSProperties } from "react";
import { GameLobby } from "../shared/types";
import { DeckSelector } from "./DeckSelector";
import play_button from '../assets/play_button.svg'

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
  return <>
    <h3 style={headerStyle}>Select decks</h3>
    <DeckSelector lobby={lobby} />
    <div style={footerStyle}>
      <button style={startButtonStyle} className="accent-button start-button"
      disabled={lobby.deck_ids.size == 0}>
        <img src={play_button} />
        <span style={{ flexGrow: 1 }}>Start</span>
      </button>
    </div>
  </>;
}