import { User, onAuthStateChanged, signInAnonymously, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Card, Form } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { firebaseAuth } from "../firebase";
import { CenteredLayout } from "./layout/CenteredLayout";
import { LoadingSpinner, useEffectOnce } from "./utils";

interface Props {
  onLogin?: (user: User) => void,
  disabled: boolean,
}

export function AnonymousLogin({ onLogin, disabled }: Props) {
  const [user, loading] = useAuthState(firebaseAuth);
  const suggestedName = "CoolNickname123";
  const [name, setName] = useState("");

  useEffectOnce(() => {
    // Load user's name only once
    return onAuthStateChanged(firebaseAuth, (newUser) => {
      if (newUser && newUser.displayName) {
        setName(newUser.displayName);
      }
    });
  });

  async function updateProfileName(userToUpdate: User) {
    let actualName = name.trim();
    if (actualName == "") {
      actualName = suggestedName;
      setName(actualName);
    }
    await updateProfile(userToUpdate, {
      displayName: actualName
    });
    console.log(`Updated user name to "${actualName}"`);
  }

  function login() {
    if (!user) {
      signInAnonymously(firebaseAuth).then((cred) => {
        console.log("Created new anonymous user");
        updateProfileName(cred.user);
        if (onLogin) onLogin(cred.user);
      })
    } else {
      if (user.displayName != name) updateProfileName(user);
      if (user.displayName) {
        console.log(`Already signed in as ${user.displayName}`);
      } else {
        console.log("Already signed in as anonymous");
      }
      if (onLogin) onLogin(user);
    }
  }

  return <CenteredLayout>
    <Card style={{
      padding: "1em",
      maxWidth: "300px",
    }}>
      <Form onSubmit={(e) => { e.preventDefault(); login(); }}>
        <Form.Group style={{ marginBottom: "1em" }}>
          <Form.Label><h4>Choose a nickname</h4></Form.Label>
          {loading ? <LoadingSpinner /> : (
            <Form.Control type="text" value={name}
              placeholder={suggestedName}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
            />
          )}
        </Form.Group>
        <CenteredLayout>
          <button disabled={loading || disabled}>Start</button>
        </CenteredLayout>
      </Form>
    </Card>
  </CenteredLayout>;
}