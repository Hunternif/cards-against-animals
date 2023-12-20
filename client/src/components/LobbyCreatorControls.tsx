import { CSSProperties, useContext, useState } from "react";
import { GameLobby } from "../shared/types";
import { DeckSelector } from "./DeckSelector";
import { startLobby } from "../model/lobby-api";
import { GameButton } from "./Buttons";
import { ErrorContext } from "./ErrorContext";
import { IconLink, IconPlay } from "./Icons";
import { LoadingSpinner } from "./LoadingSpinner";

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
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "1em",
};

const startButtonStyle: CSSProperties = {
  width: "10rem",
  maxWidth: "40vw",
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

  function handleInvite() {
    // Copies link
    navigator.clipboard.writeText(document.URL);
  }

  if (starting) return <LoadingSpinner text="Starting..." delay />;
  return <>
    <h3 style={headerStyle}>Select decks</h3>
    <DeckSelector lobby={lobby} />
    <div style={footerStyle}>
      <GameButton light style={startButtonStyle} className="start-button"
        onClick={handleInvite} icon={<IconLink />}>
        Invite
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