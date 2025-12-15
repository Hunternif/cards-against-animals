import { useCallback } from 'react';
import { InlineButton } from './Buttons';
import { Twemoji } from './Twemoji';
import { useLocalSettings } from '../pages/lobby-screens/game-components/LocalSettingsContext';

export function MuteButton() {
  const { settings, saveSettings } = useLocalSettings();

  const toggleMusic = useCallback(() => {
    settings.enableMusic = !settings.enableMusic;
    saveSettings(settings);
  }, []);

  return (
    <InlineButton big onClick={toggleMusic}>
      <Twemoji>{settings.enableMusic ? '🔊' : '🔇'}</Twemoji>
    </InlineButton>
  );
}
