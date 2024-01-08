import { User } from "firebase/auth";
import { Col, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LobbyPlayerList } from "../../components/LobbyPlayerList";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { FillLayout } from "../../components/layout/FillLayout";
import { RowLayout } from "../../components/layout/RowLayout";
import { leaveLobby } from "../../model/lobby-api";
import { GameLobby, PlayerInLobby } from "../../shared/types";
import { CSSProperties, useContext, useState } from "react";
import { LobbyCreatorControls } from "../../components/LobbyCreatorControls";
import { ErrorContext } from "../../components/ErrorContext";
import { GameButton } from "../../components/Buttons";
import { ScreenSizeSwitch } from "../../components/layout/ScreenSizeSwitch";
import { IconArowLeft, IconHamburger, IconPerson, IconTrash } from "../../components/Icons";
import { ModalBackdrop } from "../../components/ModalBackdrop";

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
        <IconPerson className="dim" />
        <span className="dim small-player-count">{props.players.length} </span>
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
        <CenteredLayout>Please wait for the game to start</CenteredLayout>
      )}
    </div>
  );
}

function PlayerListSidebar({ lobby, user, players }: Props) {
  const [leaving, setLeaving] = useState(false);
  const { setError } = useContext(ErrorContext);
  const navigate = useNavigate();

  async function handleLeave() {
    setLeaving(true);
    await leaveLobby(lobby, user)
      .then(() => navigate("/"))
      .catch((e) => {
        setError(e);
        setLeaving(false);
      });
  }

  return (
    <div style={sidebarStyle} className="new-lobby-sidebar">
      <h3 style={{ textAlign: "center" }}>Players</h3>
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