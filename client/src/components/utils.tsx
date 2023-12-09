import { EffectCallback, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { CenteredLayout } from "./layout/CenteredLayout";

interface LoadingProps {
  text?: string,
}

export function LoadingSpinner({ text }: LoadingProps) {
  return <CenteredLayout style={{ textAlign: "center" }}>
    {text && <h5 style={{ marginBottom: "1em" }}>{text}</h5>}
    <Spinner />
  </CenteredLayout>;
}

export function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []);
}
