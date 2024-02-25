import { useState } from "react";
import { GameButton } from "../../../components/Buttons";
import { Timed } from "../../../components/Delay";
import { IconLink } from "../../../components/Icons";
import { ScrollContainer } from "../../../components/layout/ScrollContainer";
import { GameLobby } from "../../../shared/types";
import { DeckSelector } from "./DeckSelector";
import { LobbySettingsPanel } from "./LobbySettingsPanel";

interface Props {
  lobby: GameLobby,
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
    <ScrollContainer scrollLight className="content">
      <DeckSelector lobby={lobby} readOnly />
      <LobbySettingsPanel settings={lobby.settings} readOnly />
    </ScrollContainer>
    <footer>
      <GameButton light className="start-button"
        onClick={handleInvite} iconLeft={<IconLink />}>
        Invite
        {showLink && <Timed onClear={() => setShowLink(false)}>
          <span className="light link-copied-popup">Link copied</span>
        </Timed>}
      </GameButton>
      <span>Please wait for the game to start</span>
    </footer>
  </>;
}