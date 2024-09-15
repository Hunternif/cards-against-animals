/** Local game settings that don't affect other players. */
type LocalSettingsState = {
  enableAudienceSound: boolean;
};

const defaultLocalSettings: LocalSettingsState = {
  enableAudienceSound: true,
};

const settingsKey = 'caa-local-settings';

function load(): LocalSettingsState {
  const out = defaultLocalSettings;
  const json = localStorage.getItem(settingsKey);
  if (json != null) {
    const parsed = JSON.parse(json);
    // Remove extra properties:
    for (const [key, val] of Object.entries(out)) {
      if (typeof parsed[key] !== typeof val) {
        delete parsed[key];
      }
    }
    return parsed as LocalSettingsState;
  } else {
    return out;
  }
}

/** Gets settings from local storage */
export function getLocalSettings(): LocalSettingsState {
  return load();
}

/** Saves settings in local storage */
export function saveLocalSettings(settings: LocalSettingsState) {
  const json = JSON.stringify(settings);
  localStorage.setItem(settingsKey, json);
}
