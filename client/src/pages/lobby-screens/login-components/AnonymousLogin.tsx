import { User, signInAnonymously } from "firebase/auth";
import { FormEvent, ReactNode, useContext, useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { firebaseAuth } from "../../../firebase";
import { randomAvatarID } from "../../../api/avatars";
import { getOrCreateCAAUser, updateUserData } from "../../../api/users-api";
import { RNG } from "../../../shared/rng";
import { CAAUser } from "../../../shared/types";
import { AvatarSelector } from "../lobby-components/AvatarSelector";
import { GameButton } from "../../../components/Buttons";
import { ErrorContext } from "../../../components/ErrorContext";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { CenteredLayout } from "../../../components/layout/CenteredLayout";


type LoginMode = "unset" | "new_user" | "existing_user";

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
  const [loginMode, setLoginMode] = useState<LoginMode>("unset");
  const newProps = { ...props, rng: RNG.fromTimestamp(), loginMode, setLoginMode };

  return <div className="login-card">
    {loadingUser ? <LoadingSpinner delay /> :
      loginMode === "new_user" ? <AnonymousLoginWithoutUser {...newProps} /> :
        user ? <AnonymousLoginWithUser {...newProps} user={user} /> :
          <AnonymousLoginWithoutUser {...newProps} />
    }
  </div>;
}

interface PropsWithoutUser extends Props {
  /** Used for selecting the initial random name & avatar */
  rng: RNG,
  /** Current mode of logging in. This prevents switching components
   * during the login process. */
  loginMode: LoginMode,
  setLoginMode: (mode: LoginMode) => void,
}

/**
 * When the user is not logged in. Set their initial name & avatar.
 */
function AnonymousLoginWithoutUser({
  onLogin, loadingNode, buttonText, rng, setLoginMode,
}: PropsWithoutUser) {
  const [loggingIn, setLoggingIn] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function handleSubmit(name: string, avatarID: string) {
    setLoginMode("new_user");
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
    // Only do this if login is not in progress:
    if (props.loginMode !== "new_user") {
      const name = props.user.displayName ?? randomNickname(props.rng);
      const avatarID = randomAvatarID(props.rng);
      getOrCreateCAAUser(props.user.uid, name, avatarID)
        .then((newCaaUser) => setCaaUser(newCaaUser))
        .catch((e) => setError(e));
    }
  }, [props.user.uid, props.loginMode]);
  return <AnonymousLoginWithCaaUser {...props} caaUser={caaUser} />;
}

interface PropsWithCaaUser extends PropsWithUser {
  caaUser: CAAUser | null,
}

/**
 * When the user is already logged in and has a CAAUser record.
 * We use the form to let them change their name & avatar.
 */
function AnonymousLoginWithCaaUser({
  user, caaUser, onLogin, loadingNode, buttonText, rng, setLoginMode,
}: PropsWithCaaUser) {
  const [updating, setUpdating] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function handleSubmit(name: string, avatarID: string) {
    setLoginMode("existing_user");
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
    name={caaUser?.name ?? ''}
    avatarID={caaUser?.avatar_id ?? ''}
    onSubmit={handleSubmit}
    buttonText={buttonText}
    loadingNode={(!caaUser || updating) ? loadingNode : null}
    rng={rng}
  />;
}

interface FormProps {
  name: string,
  avatarID?: string | null,
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
  // If the user loads late:
  if (newName == '' && name != '') setNewName(name);
  if (newAvatarID == '' && avatarID != '') setNewAvatarID(avatarID);

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
    <AvatarSelector
      avatarID={newAvatarID ?? avatarPrompt}
      onSubmit={setNewAvatarID} />
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
        <GameButton submit>{buttonText}</GameButton>
      </CenteredLayout>
    </Form>}
  </>;
}

/** Creates a random nickname in the format "CoolNickname1234" */
function randomNickname(rng: RNG) {
  return `CoolNickname${rng.randomInt() % 10000}`;
}