import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth, useFetchCAAUser } from "./firebase";

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
  const caaUser = useFetchCAAUser(user.email ?? "invalid");
  const isAdmin = caaUser?.is_admin ?? false;
  return <div className='admin-container'>
    <div className='admin-header'>
      <span>Hello, {user.displayName}!</span>
      <button onClick={() => firebaseAuth.signOut()}>Sign out</button>
    </div>
    { isAdmin ? <AdminContent/> : <div>Access denied</div>}
  </div>;
}

function AdminContent() {
  return <div>Access granted</div>;
}

function AdminPage() {
  const [user] = useAuthState(firebaseAuth);
  return user ? <LoggedInView user={user} /> : <LogInBox />;
}

export default AdminPage