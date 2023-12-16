import { EffectCallback, useEffect, useState } from "react";

export function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []);
}

/** Returns the given value after a delay, e.g. to prevent flash of loading. */
export function useDelay<T>(value: T, delayMs: number = 1000): T | null {
  const [show, setShow] = useState(false);
  let timeout: NodeJS.Timeout | null = null;

  function reset() {
    if (timeout) {
      setShow(false);
      clearTimeout(timeout);
      timeout = null;
    }
  }
  useEffect(() => {
    reset();
    timeout = setTimeout(() => {
      setShow(true);
    }, delayMs)
    return reset;
  }, [timeout, delayMs, value]);

  if (!show) return null;
  else return value;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));