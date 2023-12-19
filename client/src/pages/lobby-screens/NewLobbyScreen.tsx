import { User } from "firebase/auth";
import { Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LobbyPlayerList } from "../../components/LobbyPlayerList";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { FillLayout } from "../../components/layout/FillLayout";
import { RowLayout } from "../../components/layout/RowLayout";
import { leaveLobby } from "../../model/lobby-api";
import { GameLobby, PlayerInLobby } from "../../shared/types";
import { CSSProperties, useContext } from "react";
import { LobbyCreatorControls } from "../../components/LobbyCreatorControls";
import { ErrorContext } from "../../components/ErrorContext";

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
};

const contentStyle: CSSProperties = {
  paddingTop: "1em",
  paddingBottom: "1em",
  display: "flex",
  flexDirection: "column",
};

const scrollableColumnStyle: CSSProperties = {
  overflowY: "auto",
  paddingLeft: "1em",
  paddingRight: "calc(1em - 8px)",
};

/** User logged in AND joined the lobby. */
export function NewLobbyScreen({ lobby, user, players }: Props) {
  const { setError } = useContext(ErrorContext);
  const navigate = useNavigate();
  const isCreator = lobby.creator_uid === user.uid;

  async function handleLeave() {
    await leaveLobby(lobby, user)
      .then(() => navigate("/"))
      .catch((e) => setError(e));
  }

  return (
    <FillLayout className="new-lobby-screen">
      <RowLayout>
        <Col xs="4" md="3" xl="2" style={sidebarStyle} className="new-lobby-sidebar">
          <h3 style={{ textAlign: "center" }}>Players</h3>
          <FillLayout style={scrollableColumnStyle}
            className="miniscrollbar miniscrollbar-light">
            <LobbyPlayerList lobby={lobby} user={user} players={players} />
          </FillLayout>
          <hr />
          <button style={{ margin: "0 1em" }} onClick={handleLeave}>
            Leave
          </button>
        </Col>
        <Col style={contentStyle}>
          {isCreator ? <LobbyCreatorControls lobby={lobby} /> : (
            <CenteredLayout>Please wait for the game to start</CenteredLayout>
          )}
        </Col>
      </RowLayout>
    </FillLayout>
  );
}