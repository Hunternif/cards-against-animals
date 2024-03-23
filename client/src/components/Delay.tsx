import { ReactNode, useEffect, useState } from "react";

interface DelayProps {
  children: ReactNode,
  /** Defaults to 1000 ms */
  delayMs?: number,
  /** Called after the delay */
  onClear?: () => void;
}

/** Delays rendering children by [delayMs] milliseconds. */
export function Delay({ children, delayMs, onClear }: DelayProps) {
  const show = useDelay(true, delayMs, onClear);
  if (show) return children;
  else return <></>;
}

/** Renders children and hides them after [delayMs] milliseconds. */
export function Timed({ children, delayMs, onClear }: DelayProps) {
  const hide = useDelay(true, delayMs, onClear);
  if (!hide) return children;
  else return <></>;
}

/** Returns the given value after a delay, e.g. to prevent flash of loading. */
export function useDelay<T>(
  value: T, delayMs: number = 1000, onClear?: () => void,
): T | null {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    function reset() {
      if (timeout) {
        setShow(false);
        clearTimeout(timeout);
        timeout = null;
      }
    }

    reset();
    timeout = setTimeout(() => {
      setShow(true);
      if (onClear) onClear();
    }, delayMs);
    return reset;
  }, [delayMs, value, onClear]);

  if (!show) return null;
  else return value;
}