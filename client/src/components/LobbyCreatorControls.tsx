import { CSSProperties } from "react";
import { GameLobby } from "../shared/types";
import { DeckSelector } from "./DeckSelector";
import play_button from '../assets/play_button.svg'

interface Props {
  lobby: GameLobby,
}

const startButtonStyle: CSSProperties = {
  minWidth: "10em",
  display: "flex",
  textAlign: "center",
  paddingLeft: "0.9em",
  alignItems: "center",
};

export function LobbyCreatorControls({ lobby }: Props) {
  return <>
    <h3 style={{ textAlign: "center" }}>Select decks</h3>
    <DeckSelector />
    <div style={{
      margin: "2em 0",
      width: "100%",
      display: "flex",
      justifyContent: "center",
    }}>
      <button style={startButtonStyle} className="primary-button">
        <img src={play_button}/>
        <span style={{ flexGrow: 1 }}>Start</span>
      </button>
    </div>
  </>;
}