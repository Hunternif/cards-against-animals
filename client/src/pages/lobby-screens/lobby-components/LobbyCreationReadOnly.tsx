import { CSSProperties, useState } from "react";
import { Container } from "react-bootstrap";
import { GameLobby } from "../../../shared/types";
import { DeckSelector } from "./DeckSelector";
import { LobbySettingsPanel } from "./LobbySettingsPanel";
import { GameButton } from "../../../components/Buttons";
import { IconLink } from "../../../components/Icons";
import { Timed } from "../../../components/Delay";

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
  const [showLink, setShowLink] = useState(false);
  async function handleInvite() {
    // Copies link
    navigator.clipboard.writeText(document.URL);
    setShowLink(true);
  }

  return <>
    <header><h3>Decks</h3></header>
    <Container style={midStyle}
      className="miniscrollbar miniscrollbar-auto miniscrollbar-light">
      <DeckSelector lobby={lobby} readOnly />
      <LobbySettingsPanel settings={lobby.settings} readOnly />
    </Container>
    <footer>
      <GameButton light className="start-button"
        onClick={handleInvite} icon={<IconLink />}>
        Invite
        {showLink && <Timed onClear={() => setShowLink(false)}>
          <span className="light link-copied-popup">Link copied</span>
        </Timed>}
      </GameButton>
      <span>Please wait for the game to start</span>
    </footer>
  </>;
}