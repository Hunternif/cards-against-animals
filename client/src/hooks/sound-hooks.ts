import { useEffect, useRef, useState } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getSoundsRef, playSoundEvent } from '../api/sound-api';
import pop from '../assets/sounds/pop.mp3';
import { useGameContext } from '../pages/lobby-screens/game-components/GameContext';

/** Plays a sound whenever a new response is added */
export function useSoundOnResponse() {
  const { responses } = useGameContext();
  const [prevResponseCount, setPrevResponseCount] = useState(responses.length);
  useEffect(() => {
    if (responses.length !== prevResponseCount) {
      if (responses.length > prevResponseCount) {
        new Audio(pop).play();
      }
      setPrevResponseCount(responses.length);
    }
  }, [responses.length]);
}

/** Plays a sound whenever someone uses the soundoard */
export function useSoundboardSound() {
  const { lobby } = useGameContext();
  const [sounds] = useCollectionData(getSoundsRef(lobby.id));
  const audioPerPlayer = useRef(new Map<string, HTMLAudioElement | null>());

  // TODO: play only new sounds on page reload
  useEffect(() => {
    if (sounds && sounds.length > 0) {
      const soundsByTime = sounds
        .slice()
        .sort((a, b) => (a.time?.getTime() ?? 0) - (b.time?.getTime() ?? 0));
      const newSound = soundsByTime[soundsByTime.length - 1];
      audioPerPlayer.current.get(newSound.player_uid)?.pause();
      const audio = playSoundEvent(newSound);
      audioPerPlayer.current.set(newSound.player_uid, audio);
    }
  }, [sounds]);
}
