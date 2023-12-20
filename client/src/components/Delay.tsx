import { ReactNode, useEffect, useState } from "react";

interface DelayProps {
  children: ReactNode,
  /** Defaults to 1000 ms */
  delayMs?: number,
}

/** Delays rendering children by [delayMs] milliseconds. */
export function Delay({ children, delayMs }: DelayProps) {
  const show = useDelay(true, delayMs);
  if (show) return children;
  else return <></>;
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