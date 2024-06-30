import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useContext } from 'react';
import { getOrCreateCAAUser } from '../../../api/users-api';
import { ErrorContext } from '../../../components/ErrorContext';
import { CenteredLayout } from '../../../components/layout/CenteredLayout';
import { firebaseAuth } from '../../../firebase';

export function GoogleLogin() {
  const { setError } = useContext(ErrorContext);
  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(firebaseAuth, provider);
      await getOrCreateCAAUser(
        cred.user.uid,
        cred.user.displayName ?? 'New user',
      );
    } catch (e) {
      setError(e);
    }
  }
  return (
    <CenteredLayout>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </CenteredLayout>
  );
}
