import { useState } from 'react';
import { randomLaugh } from '../../../api/sound-api';
import { useSound } from '../../../hooks/sound-hooks';
import { PlayerResponse } from '../../../shared/types';
import { getLocalSettings } from '../../../api/local-settings';

interface Props {
  response: PlayerResponse;
  likes: number;
}

/** Plays a laugh track for this revealed response. */
export function LaughTrack({ response, likes }: Props) {
  const [soundID] = useState(randomLaugh());

  // More likes -> louder.
  const volume = Math.min(1, 0.05 + likes * 0.075);

  useSound(soundID, {
    playUntilEnd: true,
    volume,
    enabled: getLocalSettings().enableAudienceSound,
  });
  return null;
}
