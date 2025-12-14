import { useState } from 'react';
import { ErrorContext } from '../components/ErrorContext';
import { ErrorModal } from '../components/ErrorModal';
import { HomeScreen } from './lobby-screens/HomeScreen';
import { CenteredLayout } from '../components/layout/CenteredLayout';
import { GoogleLogin } from './lobby-screens/login-components/GoogleLogin';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth } from '../firebase';
import { currentSeasonState, SeasonContext } from '../components/SeasonContext';

export function WelcomePage() {
  // This could be common layout shared between all game screens
  const [error, setError] = useState(null);
  const [user, loading] = useAuthState(firebaseAuth);
  return (
    <>
      <SeasonContext.Provider value={currentSeasonState()}>
        <ErrorModal error={error} setError={setError} />
        <ErrorContext.Provider value={{ error, setError }}>
          {loading ? (
            <LoadingSpinner />
          ) : user?.isAnonymous === false ? (
            <HomeScreen />
          ) : (
            <CreatorLoginScreen />
          )}
        </ErrorContext.Provider>
      </SeasonContext.Provider>
    </>
  );
}

/** Log in via Google to create new lobbies */
function CreatorLoginScreen() {
  return (
    <CenteredLayout outerClassName="welcome-screen">
      <h1>Cards Against Animals</h1>
      <GoogleLogin />
    </CenteredLayout>
  );
}
