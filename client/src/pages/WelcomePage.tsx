import { useState } from "react";
import { ErrorContext } from "../components/ErrorContext";
import { ErrorModal } from "../components/ErrorModal";
import { LoginScreen } from "./lobby-screens/LoginScreen";

export function WelcomePage() {
  // This could be common layout shared between all game screens
  const [error, setError] = useState(null);
  return <>
    <ErrorModal error={error} setError={setError} />
    <ErrorContext.Provider value={{ error, setError }}>
      <LoginScreen />
    </ErrorContext.Provider>
  </>;
}