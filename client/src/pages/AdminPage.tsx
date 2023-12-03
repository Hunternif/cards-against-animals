import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import { Container, Spinner } from "react-bootstrap";
import { useAuthState } from 'react-firebase-hooks/auth';
import { CenteredLayout } from "../components/layout/CenteredLayout";
import { Sidebar } from "../components/layout/SidebarLayout";
import { firebaseAuth, useFetchCAAUser } from "../firebase";

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
  return <CenteredLayout style={{ textAlign: "center" }}>
    <p>Hello, {user.displayName}!</p>
    <p>Access denied</p>
    <button onClick={() => firebaseAuth.signOut()}>Sign out</button>
  </CenteredLayout>;
}

function LoggedInView({ user }: UserProps) {
  const [caaUser, loading] = useFetchCAAUser(user.email ?? "invalid");
  const isAdmin = caaUser?.is_admin ?? false;
  if (loading) return <Loading />
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
        }
      ]}
      loginNode={
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "baseline",
          marginBottom: "1em",
        }}>
          <p>Hello, {user.displayName}!</p>
          <button onClick={() => firebaseAuth.signOut()} style={{}}>Sign out</button>
        </div>
      }
    />
  </Container>;

}

function Loading() {
  return <CenteredLayout><Spinner /></CenteredLayout>;
}

export function AdminPage() {
  const [user, loading] = useAuthState(firebaseAuth);
  if (loading) return <Loading />
  return user ? <LoggedInView user={user} /> : <LogInBox />;
}