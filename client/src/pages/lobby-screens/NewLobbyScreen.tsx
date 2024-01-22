import { User } from "firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { GameButton } from "../../components/Buttons";
import { ErrorContext } from "../../components/ErrorContext";
import { IconCounter } from "../../components/IconCounter";
import { IconArowLeft, IconHamburger, IconPersonInline } from "../../components/Icons";
import { LobbyCreationReadOnly } from "../../components/LobbyCreationReadOnly";
import { LobbyCreatorControls } from "../../components/LobbyCreatorControls";
import { LobbyPlayerList } from "../../components/LobbyPlayerList";
import { ModalBackdrop } from "../../components/ModalBackdrop";
import { FillLayout } from "../../components/layout/FillLayout";
import { RowLayout } from "../../components/layout/RowLayout";
import { ScreenSizeSwitch } from "../../components/layout/ScreenSizeSwitch";
import { leaveLobby } from "../../model/lobby-api";
import { GameLobby, PlayerInLobby } from "../../shared/types";

interface Props {
  lobby: GameLobby,
  user: User,
  players: PlayerInLobby[],
}

const sidebarStyle: CSSProperties = {
  paddingTop: "1em",
  paddingBottom: "1em",
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const contentStyle: CSSProperties = {
  paddingTop: "1em",
  paddingBottom: "1em",
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const scrollableColumnStyle: CSSProperties = {
  overflowY: "auto",
  paddingLeft: "1em",
  paddingRight: "calc(1em - 8px)",
};

const menuButtonStyle: CSSProperties = {
  padding: "1rem",
  lineHeight: 1,
  cursor: "pointer",
}

const overlaySidebarStyle: CSSProperties = {
  position: "absolute",
  height: "100%",
  width: "16em",
  zIndex: 10,
}

const smallHeaderStyle: CSSProperties = {
  height: "3em",
  marginTop: "0.5em",
  position: "absolute",
  display: "flex",
  alignItems: "center",
  zIndex: 3,
}

/** User logged in AND joined the lobby. */
export function NewLobbyScreen(props: Props) {
  return (
    <FillLayout className="new-lobby-screen">
      <ScreenSizeSwitch
        widthBreakpoint={550}
        smallScreen={<SmallScreenLobby {...props} />}
        bigScreen={<BigScreenLobby {...props} />}
      />
    </FillLayout>
  );
}

function BigScreenLobby(props: Props) {
  return <RowLayout>
    <Col xs="4" md="3" xl="2">
      <PlayerListSidebar {...props} />
    </Col>
    <Col>
      <MainContent {...props} />
    </Col>
  </RowLayout>
}

function SmallScreenLobby(props: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  function openMenu() { setMenuOpen(true); }
  function closeMenu() { setMenuOpen(false); }
  return <>
    {menuOpen ? (<>
      <div style={overlaySidebarStyle}>
        <div style={{ position: "absolute", ...menuButtonStyle, ...smallHeaderStyle }}
          onClick={closeMenu}>
          <IconArowLeft width={20} height={20} />
        </div>
        <PlayerListSidebar {...props} />
      </div>
      <ModalBackdrop onClick={closeMenu} />
    </>) : (
      <div style={smallHeaderStyle}>
        <div style={menuButtonStyle} onClick={openMenu}>
          <IconHamburger width={20} height={20} />
        </div>
        <IconCounter className="dim lobby-player-counter"
          icon={<IconPersonInline />} count={props.players.length} />
      </div>
    )}
    <MainContent {...props} />
  </>;
}

function MainContent({ lobby, user }: Props) {
  const isCreator = lobby.creator_uid === user.uid;
  return (
    <div style={contentStyle}>
      {isCreator ? <LobbyCreatorControls lobby={lobby} /> : (
        <LobbyCreationReadOnly lobby={lobby} />
      )}
    </div>
  );
}

function PlayerListSidebar({ lobby, user, players }: Props) {
  const [leaving, setLeaving] = useState(false);
  const { setError } = useContext(ErrorContext);
  const navigate = useNavigate();

  // Count active players:
  const activePlayers = players.filter((p) =>
    p.role === "player" && p.status !== "left");
  const playerCount = activePlayers.length;

  async function handleLeave() {
    setLeaving(true);
    await leaveLobby(lobby, user.uid)
      .then(() => navigate("/"))
      .catch((e) => {
        setError(e);
        setLeaving(false);
      });
  }

  return (
    <div style={sidebarStyle} className="new-lobby-sidebar">
      <h3 style={{ textAlign: "center" }}>Players {playerCount > 1 && playerCount}</h3>
      <FillLayout style={scrollableColumnStyle}
        className="miniscrollbar miniscrollbar-light">
        <LobbyPlayerList lobby={lobby} user={user} players={players} />
      </FillLayout>
      <hr />
      <GameButton style={{ margin: "0 1em" }} onClick={handleLeave}
        disabled={leaving}>
        Leave
      </GameButton>
    </div>
  );
}