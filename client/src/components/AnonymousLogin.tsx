import { User, signInAnonymously } from "firebase/auth";
import { FormEvent, ReactNode, useContext, useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { firebaseAuth } from "../firebase";
import { randomAvatarID } from "../model/avatars";
import { getOrCreateCAAUser, updateUserData } from "../model/users-api";
import { RNG } from "../shared/rng";
import { CAAUser } from "../shared/types";
import { AvatarSelector } from "./AvatarSelector";
import { GameButton } from "./Buttons";
import { ErrorContext } from "./ErrorContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { CenteredLayout } from "./layout/CenteredLayout";

interface Props {
  onLogin: (user: User, caaUser: CAAUser) => void,
  loadingNode?: ReactNode,
  buttonText: string,
}

/**
 * Displays a login card where users can change their name and avatar.
 * "Anonymous" here means that they don't need any credentials to log in,
 * by using Firebase anonymous authentication.
 */
export function AnonymousLogin(props: Props) {
  const [user, loadingUser] = useAuthState(firebaseAuth);
  const rng = RNG.fromTimestamp();
  // TODO: prevent switching to login-with-user during loging in without user.
  return <div className="login-card">
    {loadingUser ? <LoadingSpinner delay /> :
      user ? <AnonymousLoginWithUser {...props} user={user} rng={rng} /> :
        <AnonymousLoginWithoutUser {...props} rng={rng} />
    }
  </div>;
}

interface PropsWithoutUser extends Props {
  /** Used for selecting the initial random name & avatar */
  rng: RNG,
}

/**
 * When the user is not logged in. Set their initial name & avatar.
 */
function AnonymousLoginWithoutUser({
  onLogin, loadingNode, buttonText, rng
}: PropsWithoutUser) {
  const [loggingIn, setLoggingIn] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function handleSubmit(name: string, avatarID: string) {
    setLoggingIn(true);
    try {
      const cred = await signInAnonymously(firebaseAuth);
      console.log(`Created new anonymous user ${cred.user.uid}. Updating...`);
      const newCaaUser = await updateUserData(cred.user.uid, name, avatarID);
      onLogin(cred.user, newCaaUser);
    } catch (e) {
      setError(e);
      setLoggingIn(false);
    }
  }

  return <LoginForm
    name=""
    onSubmit={handleSubmit}
    buttonText={buttonText}
    loadingNode={loggingIn ? loadingNode : null}
    rng={rng}
  />;
}

interface PropsWithUser extends PropsWithoutUser {
  user: User,
}

/**
 * When the user is already logged in.
 * We use the form to let them change their name & avatar.
 */
function AnonymousLoginWithUser(props: PropsWithUser) {
  const [caaUser, setCaaUser] = useState<CAAUser | null>(null);
  const { setError } = useContext(ErrorContext);

  // If CAAUser for this user doesn't exist, create it:
  useEffect(() => {
    const name = props.user.displayName ?? randomNickname(props.rng);
    const avatarID = randomAvatarID(props.rng);
    getOrCreateCAAUser(props.user.uid, name, avatarID)
      .then((newCaaUser) => setCaaUser(newCaaUser))
      .catch((e) => setError(e));
  }, [props.user.uid]);

  if (!caaUser) return <LoadingSpinner delay />;
  return <AnonymousLoginWithCaaUser {...props} caaUser={caaUser} />;
}

interface PropsWithCaaUser extends PropsWithUser {
  caaUser: CAAUser,
}

/**
 * When the user is already logged in and has a CAAUser record.
 * We use the form to let them change their name & avatar.
 */
function AnonymousLoginWithCaaUser({
  user, caaUser, onLogin, loadingNode, buttonText, rng
}: PropsWithCaaUser) {
  const [updating, setUpdating] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function handleSubmit(name: string, avatarID: string) {
    setUpdating(true);
    console.log(`Already signed in as ${user.uid}. Updating...`);
    try {
      const newCaaUser = await updateUserData(user.uid, name, avatarID);
      console.log(`Updated user name to ${name}`);
      onLogin(user, newCaaUser);
    } catch (e) {
      setError(e);
      setUpdating(false);
    }
  }

  return <LoginForm
    name={caaUser?.name ?? user.displayName ?? ""}
    avatarID={caaUser?.avatar_id}
    onSubmit={handleSubmit}
    buttonText={buttonText}
    loadingNode={updating ? loadingNode : null}
    rng={rng}
  />;
}

interface FormProps {
  name: string,
  avatarID?: string,
  onSubmit: (name: string, avatarID: string) => void | Promise<void>,
  /** If present, shows loading. */
  loadingNode?: ReactNode,
  /** Used for selecting the initial random name & avatar */
  rng: RNG,
  buttonText: string,
}

/** The actual form */
function LoginForm({
  name, avatarID, onSubmit, loadingNode, buttonText, rng,
}: FormProps) {
  const [newName, setNewName] = useState(name);
  const [newAvatarID, setNewAvatarID] = useState(avatarID);
  const [namePrompt] = useState(randomNickname(rng));
  const [avatarPrompt] = useState(randomAvatarID(rng));

  function handleSubmit(e: FormEvent) {
    // Prevent submitting the form from refreshing the page:
    e.preventDefault();
    // Don't allow submitting empty names:
    let actualName = newName.trim();
    if (actualName === "") actualName = namePrompt;
    const actualAvatarID = newAvatarID ?? avatarPrompt;
    onSubmit(actualName, actualAvatarID);
  }

  return <>
    <AvatarSelector avatarID={newAvatarID ?? avatarPrompt} onSelect={setNewAvatarID} />
    {loadingNode ?? <Form onSubmit={handleSubmit}>
      <Form.Group style={{ marginBottom: "1em" }}>
        <Form.Label><h4>Choose a nickname</h4></Form.Label>
        <Form.Control type="text"
          value={newName}
          placeholder={namePrompt}
          onChange={(e) => setNewName(e.target.value)}
        />
      </Form.Group>
      <CenteredLayout>
        <GameButton>{buttonText}</GameButton>
      </CenteredLayout>
    </Form>}
  </>;
}

/** Creates a random nickname in the format "CoolNickname1234" */
function randomNickname(rng: RNG) {
  return `CoolNickname${rng.randomInt() % 10000}`;
}