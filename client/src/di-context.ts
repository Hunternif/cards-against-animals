import { createContext, useContext } from "react";
import {
  FirestoreDeckRepository,
  IDeckRepository,
} from "./api/deck-repository";
import { db } from "./firebase";

interface DIContextState {
  deckRepository: IDeckRepository;
}

/**
 * Dependency injection context.
 */
export const DIContext = createContext<DIContextState>({
  deckRepository: new FirestoreDeckRepository(db),
});

/**
 * Get current context.
 * From https://stackoverflow.com/a/69735347/1093712
 */
export const useDIContext = () => {
  const context = useContext(DIContext);
  if (!context)
    throw new Error("No GameContext.Provider found when calling useDIContext.");
  return context;
};
