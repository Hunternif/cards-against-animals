import { User } from "firebase/auth";
import { Col } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLoaderData } from "react-router-dom";
import { LobbyPlayerList } from "../../components/LobbyPlayerList";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { FillLayout } from "../../components/layout/FillLayout";
import { RowLayout } from "../../components/layout/RowLayout";
import { LoadingSpinner } from "../../components/utils";
import { firebaseAuth } from "../../firebase";
import { useJoinLobby, useLobby } from "../../model/lobby-api";
import { LoginScreen } from "./LoginScreen";

interface LoaderParams {
  params: any
}

export function lobbyLoader({ params }: LoaderParams): string {
  return params['lobbyID'] as string;
}

/** User opened the lobby screen, but not necessarily logged in or in this lobby. */
export function LobbyScreen() {
  // Double-check that we are logged in.
  // Users who are sent the link will need to log in first.
  const [user, loadingUser] = useAuthState(firebaseAuth);
  const lobbyID = useLoaderData() as string;
  if (loadingUser) return <LoadingSpinner text="Loading..." />;
  if (!user) return <LoginScreen existingLobbyID={lobbyID} />;
  return <LoggedInLobbyScreen user={user} lobbyID={lobbyID} />;
}

interface LoggedInProps {
  lobbyID: string,
  user: User,
}

/** User logged in, but not necessarily joined the lobby. */
function LoggedInLobbyScreen({ lobbyID, user }: LoggedInProps) {
  const [joined] = useJoinLobby(lobbyID, user);
  if (!joined) return <LoadingSpinner text="Joining..." />;
  return <JoinedLobbyScreen user={user} lobbyID={lobbyID} />
}

/** User logged in AND joined the lobby. */
function JoinedLobbyScreen({ lobbyID, user }: LoggedInProps) {
  const [lobby, loadingLobby] = useLobby(lobbyID);
  if (loadingLobby) return <LoadingSpinner text="Loading lobby..." />;
  if (!lobby) throw new Error(`Failed to load lobby ${lobbyID}`);
  return (
    <FillLayout>
      <RowLayout>
        <Col xs="4" md="3" style={{
          backgroundColor: "#66666633",
          padding: "1em",
          display: "flex",
          flexDirection: "column",
        }}>
          <FillLayout>
            <h3 style={{ textAlign: "center", marginBottom: "0.5em" }}>Players</h3>
            <LobbyPlayerList lobby={lobby} user={user} />
          </FillLayout>
          <hr />
          <button disabled={true}>Leave</button>
        </Col>
        <Col>
          <CenteredLayout>Content goes here</CenteredLayout>
        </Col>
      </RowLayout>
    </FillLayout>
  );
}