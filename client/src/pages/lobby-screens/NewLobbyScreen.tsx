import { User } from "firebase/auth";
import { Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LobbyPlayerList } from "../../components/LobbyPlayerList";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { FillLayout } from "../../components/layout/FillLayout";
import { RowLayout } from "../../components/layout/RowLayout";
import { leaveLobby } from "../../model/lobby-api";
import { GameLobby } from "../../shared/types";

interface Props {
  lobby: GameLobby,
  user: User,
}

/** User logged in AND joined the lobby. */
export function NewLobbyScreen({ lobby, user }: Props) {
  const navigate = useNavigate();
  return (
    <FillLayout>
      <RowLayout>
        <Col xs="4" md="3" style={{
          backgroundColor: "#66666633",
          paddingTop: "1em",
          paddingBottom: "1em",
          display: "flex",
          flexDirection: "column",
        }}>
          <h3 style={{ textAlign: "center" }}>Players</h3>
          <FillLayout style={{
            overflowY: "auto",
            paddingLeft: "1em",
            paddingRight: "calc(1em - 8px)",
          }} className="miniscrollbar">
            <LobbyPlayerList lobby={lobby} user={user} />
          </FillLayout>
          <hr />
          <button style={{ margin: "0 1em" }}
            onClick={() => {
              leaveLobby(lobby, user).then(() => navigate("/"));
            }}>
            Leave
          </button>
        </Col>
        <Col>
          <CenteredLayout>Content goes here</CenteredLayout>
        </Col>
      </RowLayout>
    </FillLayout>
  );
}