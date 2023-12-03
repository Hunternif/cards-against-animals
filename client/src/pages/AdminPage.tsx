import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import { Container } from "react-bootstrap";
import { useAuthState } from 'react-firebase-hooks/auth';
import { UploadDeck } from "../components/UploadDeck";
import { firebaseAuth, useFetchCAAUser } from "../firebase";

function LogInBox() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(firebaseAuth, provider);
  }
  return <button onClick={signInWithGoogle}>Sign in with Google</button>;
}

interface UserProps {
  user: User;
}

function LoggedInView({ user }: UserProps) {
  const [caaUser, loading] = useFetchCAAUser(user.email ?? "invalid");
  const isAdmin = caaUser?.is_admin ?? false;
  return (
    <Container>
      <div className='admin-header'>
        <span>Hello, {user.displayName}!</span>
        <button onClick={() => firebaseAuth.signOut()}>Sign out</button>
      </div>
      {!loading && (isAdmin ? <UploadDeck /> : <div>Access denied</div>)}
    </Container>
  );
}

export function AdminPage() {
  const [user] = useAuthState(firebaseAuth);
  return user ? <LoggedInView user={user} /> : <LogInBox />;
}