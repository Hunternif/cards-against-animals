import { createContext, useContext, useState } from 'react';
import {
  getLocalSettings,
  LocalSettingsState,
  saveLocalSettings,
} from '../../../api/local-settings';

export interface LocalSettingsContextState {
  settings: LocalSettingsState;
  saveSettings: (settings: LocalSettingsState) => void;
}

export const LocalSettingsContext = createContext<
  LocalSettingsContextState | undefined
>(undefined);

/**
 * Context provider that allows updates from children.
 * From https://stackoverflow.com/a/57435454/1093712
 */
export function LocalSettingsContextProvider(props: React.PropsWithChildren) {
  function saveSettings(newValue: LocalSettingsState) {
    saveLocalSettings(newValue);
    setState({ ...state, settings: newValue });
  }
  const initState: LocalSettingsContextState = {
    settings: getLocalSettings(),
    saveSettings,
  };
  const [state, setState] = useState(initState);
  return (
    <LocalSettingsContext.Provider value={state}>
      {props.children}
    </LocalSettingsContext.Provider>
  );
}

export const useLocalSettings = () => {
  const gameContext = useContext(LocalSettingsContext);
  if (!gameContext)
    throw new Error(
      'No LocalSettingsContextProvider found when calling useGameContext.',
    );
  return gameContext;
};
