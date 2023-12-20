import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import { Container } from "react-bootstrap";
import { useAuthState } from 'react-firebase-hooks/auth';
import { CenteredLayout } from "../components/layout/CenteredLayout";
import { Sidebar } from "../components/layout/SidebarLayout";
import { firebaseAuth } from "../firebase";
import { AdminUserPill } from "../components/AdminUserPill";
import { signOut, useCAAUserOnce } from "../model/users-api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorContext } from "../components/ErrorContext";
import { ErrorModal } from "../components/ErrorModal";
import { useContext, useState } from "react";

function LogInBox() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(firebaseAuth, provider);
  }
  return <CenteredLayout>
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  </CenteredLayout>;
}

interface UserProps {
  user: User;
}

function AccessDeniedView({ user }: UserProps) {
  const {setError} = useContext(ErrorContext);
  async function handleSignOut() {
    await signOut(user).catch((e) => setError(e));
  }
  return <CenteredLayout style={{ textAlign: "center" }}>
    <p>Hello, {user.displayName}!</p>
    <p>Access denied</p>
    <button onClick={handleSignOut}>Sign out</button>
  </CenteredLayout>;
}

function AnonymousLoggedInView({ user }: UserProps) {
  return <CenteredLayout>
    <AccessDeniedView user={user} />
    <br />
    <LogInBox />
  </CenteredLayout>;
}

function LoggedInView({ user }: UserProps) {
  const [caaUser, loading] = useCAAUserOnce(user.uid ?? "invalid");
  const isAdmin = caaUser?.is_admin ?? false;
  if (loading) return <LoadingSpinner delay text="Loading..." />
  if (user.isAnonymous) return <AnonymousLoggedInView user={user} />
  if (isAdmin) return <AdminContent user={user} />;
  return <AccessDeniedView user={user} />
}

function AdminContent({ user }: UserProps) {
  return <Container style={{
    padding: "1em",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  }}>
    <Sidebar
      links={[
        {
          label: "Lobbies",
          path: "lobbies"
        },
        {
          label: "Decks",
          path: "decks"
        },
        {
          label: "Upload deck",
          path: "uploadDeck"
        },
        {
          label: "Upload deck from TSV",
          path: "uploadDeckTsv"
        }
      ]}
      loginNode={<AdminUserPill user={user} />}
    />
  </Container>;

}

export function AdminPage() {
  const [error, setError] = useState<any | null>(null);
  return <>
    <ErrorModal error={error} setError={setError} />
    <ErrorContext.Provider value={{ error, setError }}>
      <AdminPageThrows />
    </ErrorContext.Provider>
  </>;
}

function AdminPageThrows() {
  const [user, loading] = useAuthState(firebaseAuth);
  if (loading) return <LoadingSpinner />
  if (user) return <LoggedInView user={user} />;
  return <LogInBox />;
}