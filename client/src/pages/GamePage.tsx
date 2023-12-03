import { useAuthState } from "react-firebase-hooks/auth";
import { CenteredLayout } from "../components/layout/CenteredLayout";
import { firebaseAuth } from "../firebase";
import { signInAnonymously } from "firebase/auth";
import { useEffect, useState } from "react";

export function GamePage() {
  const [user, loading] = useAuthState(firebaseAuth);
  useEffect(() => {
    if (!loading && !user) {
      // User is logged out. Let's create a new anonymous user.
      // This is an async function!
      signInAnonymously(firebaseAuth).then((userCred) => {
        console.log("Signed in with new anonymous user");
      });
    } else if (user) {
      console.log(`Signed in as ${user?.displayName}`);
    }
  },
    [user, loading]
  );
  return (
    <CenteredLayout>
      <h1>Cards Against Animals</h1>
    </CenteredLayout>
  )
}