import { Container } from "react-bootstrap";
import { GameLobby } from "../shared/types";
import { CSSProperties } from "react";
import { DeckSelector } from "./DeckSelector";
import { LobbySettings } from "./LobbySettings";

interface Props {
  lobby: GameLobby,
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

/** Read-only view of the current lobby settings, for non-creator players */
export function LobbyCreationReadOnly({ lobby }: Props) {
  return <>
    <header><h3>Decks</h3></header>
    <Container style={midStyle}
      className="miniscrollbar miniscrollbar-auto miniscrollbar-light">
      <DeckSelector lobby={lobby} readOnly />
      <LobbySettings lobby={lobby} readOnly />
    </Container>
    <footer>
      Please wait for the game to start
    </footer>
  </>;
}