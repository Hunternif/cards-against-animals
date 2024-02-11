import { CSSProperties, useContext, useState } from "react";
import { Container } from "react-bootstrap";
import { GameButton } from "../../../components/Buttons";
import { Timed } from "../../../components/Delay";
import { ErrorContext } from "../../../components/ErrorContext";
import { IconLink, IconPlay } from "../../../components/Icons";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { startLobby, updateLobby } from "../../../model/lobby-api";
import { GameLobby } from "../../../shared/types";
import { DeckSelector } from "./DeckSelector";
import { LobbySettingsPanel } from "./LobbySettingsPanel";

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
  gap: "1em",
  overflowY: "auto",
}

export function LobbyCreatorControls({ lobby }: Props) {
  const [starting, setStarting] = useState(false);
  const [showLink, setShowLink] = useState(false);
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

  async function handleInvite() {
    // Copies link
    navigator.clipboard.writeText(document.URL);
    setShowLink(true);
  }

  async function handleSettingsChange() {
    // Creator can change settings directly.
    await updateLobby(lobby).catch(e => setError(e));
  }

  if (starting) return <LoadingSpinner text="Starting..." delay />;
  return <>
    <header><h3>Select decks</h3></header>
    <Container style={midStyle}
      className="miniscrollbar miniscrollbar-auto miniscrollbar-light">
      <DeckSelector lobby={lobby} />
      <LobbySettingsPanel settings={lobby.settings} onChange={handleSettingsChange} />
    </Container>
    <footer>
      <GameButton light className="start-button"
        onClick={handleInvite} iconLeft={<IconLink />}>
        Invite
        {showLink && <Timed onClear={() => setShowLink(false)}>
          <span className="light link-copied-popup">Link copied</span>
        </Timed>}
      </GameButton>
      <GameButton accent className="start-button"
        onClick={handleStart}
        disabled={lobby.deck_ids.size == 0}
        iconLeft={<IconPlay />}>
        Start
      </GameButton>
    </footer>
  </>;
}