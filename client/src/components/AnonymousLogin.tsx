import { User, onAuthStateChanged, signInAnonymously, updateProfile } from "firebase/auth";
import { EffectCallback, useEffect, useState } from "react";
import { Card, Form, Spinner } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { firebaseAuth } from "../firebase";
import { CenteredLayout } from "./layout/CenteredLayout";

function Loading() {
  return <CenteredLayout><Spinner /></CenteredLayout>;
}

interface Props {
  onLogin?: () => void,
}

async function updateName(user: User, name: string) {
  await updateProfile(user, {
    displayName: name
  });
  console.log(`Updated user name to "${name}"`);
}

function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []);
}

export function AnonymousLogin({ onLogin }: Props) {
  const [user, loading] = useAuthState(firebaseAuth);
  const [name, setName] = useState("CoolNickname123");
  useEffectOnce(() => {
    // Load user's name only once
    onAuthStateChanged(firebaseAuth, (newUser) => {
      if (newUser && newUser.displayName) {
        setName(newUser.displayName);
      }
    });
  });
  function login() {
    if (!user) {
      signInAnonymously(firebaseAuth).then((cred) => {
        console.log("Created new anonymous user");
        updateName(cred.user, name);
      })
    } else {
      updateName(user, name);
      if (user.displayName) {
        console.log(`Already signed in as ${user.displayName}`);
      } else {
        console.log("Already signed in as anonymous");
      }
    }
    if (onLogin) onLogin();
  }

  return <CenteredLayout>
    <Card style={{
      padding: "1em",
      maxWidth: "300px",
    }}>
      <Form onSubmit={(e) => { e.preventDefault(); login(); }}>
        <Form.Group style={{ marginBottom: "1em" }}>
          <Form.Label><h4>Choose a nickname</h4></Form.Label>
          {loading ? <Loading /> : (
            <Form.Control type="text" value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Form.Group>
        <CenteredLayout>
          <button disabled={loading}>Start</button>
        </CenteredLayout>
      </Form>
    </Card>
  </CenteredLayout>;
}