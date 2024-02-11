import { createContext, useState } from "react";

/**
 * Stores content height calculated from all stacks of cards on the screen,
 * to align them.
 */
export interface CardOffsetState {
  heights: number[],
  setHeights: (newValue: number[]) => void,
}

export const CardOffsetContext = createContext<CardOffsetState | undefined>(
  undefined
);

/**
 * Context provider that allows updates from children.
 * From https://stackoverflow.com/a/57435454/1093712
 */
export function CardOffsetContextProvider(props: React.PropsWithChildren) {
  function setHeights(newValue: number[]) {
    setState({ ...state, heights: newValue });
  }
  const initState: CardOffsetState = {
    heights: [],
    setHeights,
  }
  const [state, setState] = useState(initState);
  return <CardOffsetContext.Provider value={state}>
    {props.children}
  </CardOffsetContext.Provider>;
}