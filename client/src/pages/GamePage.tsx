import { AnonymousLogin } from "../components/AnonymousLogin";
import { CenteredLayout } from "../components/layout/CenteredLayout";

export function GamePage() {
  return <CenteredLayout>
    <h1 style={{ marginBottom: "1em" }}>Cards Against Animals</h1>
    <AnonymousLogin />
  </CenteredLayout>;
}