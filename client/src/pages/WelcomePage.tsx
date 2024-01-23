import { SEO } from "./SEO";
import { LoginScreen } from "./lobby-screens/LoginScreen";

export function WelcomePage() {
  // This could be common layout shared between all game screens
  return <>
    <SEO />
    <LoginScreen />
  </>;
}