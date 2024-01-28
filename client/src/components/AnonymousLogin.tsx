import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { FormEvent, ReactNode, useContext, useState } from "react";
import { Form } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { firebaseAuth } from "../firebase";
import { updateUserData } from "../model/users-api";
import { AnonymourAvatarSelector } from "./AvatarSelector";
import { GameButton } from "./Buttons";
import { useDelay } from "./Delay";
import { ErrorContext } from "./ErrorContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { CenteredLayout } from "./layout/CenteredLayout";
import { useEffectOnce } from "./utils";

interface Props {
  onLogin?: (user: User) => void,
  loadingNode?: ReactNode,
  buttonText: string,
}

export function AnonymousLogin({ onLogin, loadingNode, buttonText }: Props) {
  const { setError } = useContext(ErrorContext);
  const [user, loadingUser] = useAuthState(firebaseAuth);
  const suggestedName = "CoolNickname123";
  const [name, setName] = useState(user?.displayName ?? "");
  const [loggingIn, setLoggingIn] = useState(false);
  const delayedLoadingUser = useDelay(loadingUser, 400);
  const delayedLoggingIn = useDelay(loggingIn, 400);
  const showLoading = loadingNode !== undefined && loadingNode !== null;
  const delayedLoading = useDelay(showLoading, 400);

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
    await updateUserData(userToUpdate, actualName);
    console.log(`Updated user name to "${actualName}"`);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault(); // Prevent submitting the form from refreshing the page
    try {
      if (!user) {
        setLoggingIn(true);
        const cred = await signInAnonymously(firebaseAuth);
        console.log("Created new anonymous user");
        await updateProfileName(cred.user);
        setLoggingIn(false);
        if (onLogin) onLogin(cred.user);
      } else {
        if (user.displayName != name) {
          setLoggingIn(true);
          await updateProfileName(user);
          setLoggingIn(false);
        }
        if (user.displayName) {
          console.log(`Already signed in as ${user.displayName}`);
        } else {
          console.log("Already signed in as anonymous");
        }
        if (onLogin) onLogin(user);
      }
    } catch (e) {
      setError(e);
      setLoggingIn(false);
    }
  }

  return (
    <div className="login-card">
      {delayedLoggingIn ? <LoadingSpinner text="Logging in..." /> :
        delayedLoading ? loadingNode : <>
          <AnonymourAvatarSelector userID={user?.uid} />
          <Form onSubmit={handleLogin}>
            <Form.Group style={{ marginBottom: "1em" }}>
              <Form.Label><h4>Choose a nickname</h4></Form.Label>
              {delayedLoadingUser ? <LoadingSpinner /> : (
                <Form.Control type="text" value={name}
                  placeholder={loadingUser ? "" : suggestedName}
                  onChange={(e) => setName(e.target.value)}
                  disabled={showLoading}
                />
              )}
            </Form.Group>
            <CenteredLayout>
              <GameButton disabled={delayedLoadingUser || showLoading}>
                {buttonText}
              </GameButton>
            </CenteredLayout>
          </Form>
        </>}
    </div>
  );
}