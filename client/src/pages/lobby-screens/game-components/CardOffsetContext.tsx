import { createContext, useState } from "react";

/**
 * Stores offsets calculated from all stacks of cards on the screen,
 * to align them.
 */
export interface CardOffsetState {
  offsets: number[],
  setOffsets: (newValue: number[]) => void,
}

export const CardOffsetContext = createContext<CardOffsetState | undefined>(
  undefined
);

/**
 * Context provider that allows updates from children.
 * From https://stackoverflow.com/a/57435454/1093712
 */
export function CardOffsetContextProvider(props: React.PropsWithChildren) {
  function setOffsets(newValue: number[]) {
    setState({ ...state, offsets: newValue });
  }
  const initState: CardOffsetState = {
    offsets: [],
    setOffsets,
  }
  const [state, setState] = useState(initState);
  return <CardOffsetContext.Provider value={state}>
    {props.children}
  </CardOffsetContext.Provider>;
}