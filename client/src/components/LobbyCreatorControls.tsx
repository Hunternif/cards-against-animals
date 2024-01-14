import { CSSProperties, useContext, useState } from "react";
import { Container } from "react-bootstrap";
import { startLobby } from "../model/lobby-api";
import { GameLobby } from "../shared/types";
import { GameButton } from "./Buttons";
import { DeckSelector } from "./DeckSelector";
import { Timed } from "./Delay";
import { ErrorContext } from "./ErrorContext";
import { IconLink, IconPlay } from "./Icons";
import { LoadingSpinner } from "./LoadingSpinner";
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
  gap: "1em",
}
const compactSectionStyle: CSSProperties = {
  minHeight: 0,
  width: "100%",
}

const footerStyle: CSSProperties = {
  margin: "2em 0",
  width: "100%",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "1em",
};

const startButtonStyle: CSSProperties = {
  width: "10rem",
  maxWidth: "40vw",
  position: "relative",
};

const linkCopiedStyle: CSSProperties = {
  position: "absolute",
  bottom: "100%",
  paddingBottom: "0.3rem",
  width: "100%",
  left: 0,
};

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

  if (starting) return <LoadingSpinner text="Starting..." delay />;
  return <>
    <h3 style={headerStyle}>Select decks</h3>
    <Container style={midStyle}>
      {/* The section div keeps minimum height and prevents overflow */}
      <div style={compactSectionStyle}>
        <DeckSelector lobby={lobby} />
      </div>
      <LobbySettings lobby={lobby} />
    </Container>
    <div style={footerStyle}>
      <GameButton light style={startButtonStyle} className="start-button"
        onClick={handleInvite} icon={<IconLink />}>
        Invite
        {showLink && <Timed onClear={() => setShowLink(false)}>
          <span style={linkCopiedStyle} className="light">Link copied</span>
        </Timed>}
      </GameButton>
      <GameButton accent style={startButtonStyle} className="start-button"
        onClick={handleStart}
        disabled={lobby.deck_ids.size == 0}
        icon={<IconPlay />}>
        Start
      </GameButton>
    </div>
  </>;
}