import { EffectCallback, useEffect, useRef } from 'react';

export function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []);
}

/**
 * Hook to call callback when any of the keys are pressed.
 * Example usage:
 * ```
 * useKeyDown(() => someCallback(), ["Escape"]);
 * ```
 * Thanks to https://medium.com/@paulohfev/e68c8b0a371
 */
export function useKeyDown(callback: () => void, keys: string[]) {
  function onKeyDown(event: KeyboardEvent) {
    const wasAnyKeyPressed = keys.some((key) => event.key === key);
    if (wasAnyKeyPressed) {
      event.preventDefault();
      callback();
    }
  }
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
}

/**
 * Calls the provided callback when the user clicks outside of an element.
 * The element must use the ref that is returned from this hook
 * From https://bigfrontend.dev/react/useclickoutside/discuss
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
): React.Ref<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const click = ({ target }: Event): void => {
      if (target && ref.current && !ref.current.contains(target as Node)) {
        callback();
      }
    };
    // Chrome doesn't support mousedown.
    // See https://stackoverflow.com/a/41238807/1093712
    document.addEventListener('pointerdown', click);

    return () => {
      document.removeEventListener('pointerdown', click);
    };
  }, []);
  return ref;
}

/** Calls the callback on any mouse click */
export function useClick(callback: () => void) {
  useEffect(() => {
    const click = () => {
      callback();
    };
    // Chrome doesn't support mousedown.
    // See https://stackoverflow.com/a/41238807/1093712
    document.addEventListener('pointerdown', click);

    return () => {
      document.removeEventListener('pointerdown', click);
    };
  }, []);
}
