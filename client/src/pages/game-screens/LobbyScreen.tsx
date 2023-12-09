import { User } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { useLoaderData } from "react-router-dom";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { LoadingSpinner } from "../../components/utils";
import { firebaseAuth, lobbiesRef } from "../../firebase";
import { useJoinLobby } from "../../model/lobby-api";
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
  if (loadingUser) return <LoadingSpinner />;
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
  if (!joined) return <LoadingSpinner />;
  return <JoinedLobbyScreen user={user} lobbyID={lobbyID}/>
}

/** User logged in AND joined the lobby. */
function JoinedLobbyScreen({ lobbyID }: LoggedInProps) {
  const [lobby, loading] = useDocumentData(doc(lobbiesRef, lobbyID));
  if (loading) return <LoadingSpinner />;
  return <CenteredLayout>
    {lobby && <h2>Your lobby: {lobby.id}</h2>}
  </CenteredLayout>;
}