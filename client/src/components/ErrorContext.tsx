import { createContext } from "react";

interface ContextState {
  error?: any,
  setError: (error?: any) => void,
}

/**
 * This is an alternative mechanism for error handling,
 * when the error is recoverable, and the component can continue rendering.
 * 
 * A child component can add error to this context, and a top-level modal
 * can render it. The child continues its rendering as normal.
 */
export const ErrorContext = createContext<ContextState>({
  error: null,
  setError: (e) => {},
});