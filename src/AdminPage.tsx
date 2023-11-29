import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth } from "./firebase";
import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";

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
  return <div className='admin-container'>
    <div className='admin-header'>
      <span>Hello, {user.displayName}!</span>
      <button onClick={() => firebaseAuth.signOut()}>Sign out</button>
    </div>
  </div>;
}

function AdminPage() {
  const [user] = useAuthState(firebaseAuth);
  return user ? <LoggedInView user={user} /> : <LogInBox />;
}

export default AdminPage