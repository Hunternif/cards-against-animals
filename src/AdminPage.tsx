// This import is needed because of bugs in the firebaseui module:
import * as firebaseui from "firebaseui";
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth } from "./firebase";
import { useEffect } from "react";
import { EmailAuthProvider, User } from "firebase/auth";

const ui = new firebaseui.auth.AuthUI(firebaseAuth);

function LogInBox() {
  useEffect(() => {
    ui.start(".firebase-auth-container", {
      signInFlow: "popup",
      signInOptions: [
        {
          provider: EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        }
      ]
    })
  });
  return <div className="firebase-auth-container"></div>
}

interface UserProps {
  user: User;
}

function LoggedInView({ user }: UserProps) {
  return <div>
    <div>Hello, {user.displayName}!</div>
    <button onClick={() => firebaseAuth.signOut()}>Sign out</button>
  </div>;
}

function AdminPage() {
  const [user] = useAuthState(firebaseAuth);
  return user ? <LoggedInView user={user} /> : <LogInBox />;
}

export default AdminPage