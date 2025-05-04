/** Local game settings that don't affect other players. */
export type LocalSettingsState = {
  enableAudienceSound: boolean;
  enableMusic: boolean;
  enableParticles: boolean;
};

const defaultLocalSettings: LocalSettingsState = {
  enableAudienceSound: true,
  enableMusic: true,
  enableParticles: true,
};

const settingsKey = 'caa-local-settings';

function load(): LocalSettingsState {
  const out = defaultLocalSettings;
  const json = localStorage.getItem(settingsKey);
  if (json != null) {
    const parsed = JSON.parse(json);
    // Remove extra properties and copy missing default values:
    for (const [key, val] of Object.entries(out)) {
      if (parsed[key] === undefined) {
        parsed[key] = val;
      } else if (typeof parsed[key] !== typeof val) {
        delete parsed[key];
      }
    }
    return parsed as LocalSettingsState;
  } else {
    return out;
  }
}

let cache: LocalSettingsState;

/** Gets settings from local storage */
export function getLocalSettings(): LocalSettingsState {
  if (cache) return cache;
  cache = load();
  return cache;
}

/** Saves settings in local storage */
export function saveLocalSettings(settings: LocalSettingsState) {
  Object.assign(cache, settings);
  const json = JSON.stringify(settings);
  localStorage.setItem(settingsKey, json);
}
