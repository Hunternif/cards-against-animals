import { Button, Card, Form, Spinner } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { firebaseAuth } from "../firebase";
import { CenteredLayout } from "./layout/CenteredLayout";
import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";

function Loading() {
  return <CenteredLayout><Spinner /></CenteredLayout>;
}

interface Props {
  onLogin?: () => void,
}

export function AnonymousLogin({ onLogin }: Props) {
  const [user, loading] = useAuthState(firebaseAuth);
  const [name, setName] = useState("");
  useEffect(() => {
    if (user && name != user.displayName) { setName(user.displayName ?? ""); }
  },
    [user, setName]
  );
  function login() {
    if (!user) {
      signInAnonymously(firebaseAuth).then(() => {
        console.log("Created new anonymous user");
      });
    } else if (user.displayName) {
      console.log(`Already signed in as ${user.displayName}`);
    } else {
      console.log("Already signed in as anonymous");
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
              placeholder="CoolNickname123"
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