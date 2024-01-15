import { Container } from "react-bootstrap";
import { GameLobby } from "../shared/types";
import { CSSProperties } from "react";
import { DeckSelector } from "./DeckSelector";
import { LobbySettings } from "./LobbySettings";

interface Props {
  lobby: GameLobby,
}

const headerStyle: CSSProperties = {
  textAlign: "center",
}

const midStyle: CSSProperties = {
  flexGrow: 1,
  maxWidth: "50em",
  padding: 0,
  flex: "1 1 auto",
  width: "100%",
  minHeight: 0, // this prevents overflowing parent flexbox
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
}
const compactSectionStyle: CSSProperties = {
  minHeight: "15em",
  width: "100%",
}

const footerStyle: CSSProperties = {
  margin: "2em 0",
  width: "100%",
  display: "flex",
  justifyContent: "center",
};

/** Read-only view of the current lobby settings, for non-creator players */
export function LobbyCreationReadOnly({ lobby }: Props) {
  return <>
    <h3 style={headerStyle}>Decks</h3>
    <Container style={midStyle}
      className="miniscrollbar miniscrollbar-auto miniscrollbar-light">
      {/* The section div keeps minimum height and prevents overflow */}
      <div style={compactSectionStyle}>
        <DeckSelector lobby={lobby} readOnly />
      </div>
      <LobbySettings lobby={lobby} readOnly />
    </Container>
    <div style={footerStyle}>
      Please wait for the game to start
    </div>
  </>;
}