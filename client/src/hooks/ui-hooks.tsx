import { EffectCallback, useEffect } from 'react';

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
