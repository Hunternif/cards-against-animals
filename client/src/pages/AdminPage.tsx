import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import { Container, Spinner } from "react-bootstrap";
import { useAuthState } from 'react-firebase-hooks/auth';
import { UploadDeck } from "../components/UploadDeck";
import { firebaseAuth, useFetchCAAUser } from "../firebase";
import { CenteredLayout } from "../components/layout/CenteredLayout";

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
  if (loading) return <Loading/>
  if (isAdmin) return <AdminContent user={user} />;
  return <AccessDeniedView user={user} />
}

function AdminContent({ user }: UserProps) {
  return <Container style={{
    padding: "1em",
  }}>
    <div style={{
      display: "flex",
      alignItems: "baseline",
      marginBottom: "1em",
    }}>
      <span style={{ flex: "1 1 auto" }}>Hello, {user.displayName}!</span>
      <button onClick={() => firebaseAuth.signOut()} style={{}}>Sign out</button>
    </div>
    <UploadDeck />
  </Container>;

}

function Loading() {
  return <CenteredLayout><Spinner /></CenteredLayout>;
}

export function AdminPage() {
  const [user, loading] = useAuthState(firebaseAuth);
  if (loading) return <Loading/>
  return user ? <LoggedInView user={user} /> : <LogInBox />;
}