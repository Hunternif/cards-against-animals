import { EffectCallback, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { CenteredLayout } from "./layout/CenteredLayout";

export function LoadingSpinner() {
  return <CenteredLayout><Spinner /></CenteredLayout>;
}

export function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []);
}
