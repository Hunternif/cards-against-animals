import { useEffect, useState } from 'react';
import pop from '../assets/sounds/pop.mp3';
import { useGameContext } from '../pages/lobby-screens/game-components/GameContext';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getSoundUrl, getSoundsRef } from '../api/turn/turn-sound-api';

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
  const { lobby, turn } = useGameContext();
  const [sounds] = useCollectionData(getSoundsRef(lobby.id, turn.id));
  // TODO: play only new sounds on page reload
  useEffect(() => {
    if (sounds && sounds.length > 0) {
      const lastSound = sounds[sounds.length - 1];
      const url = getSoundUrl(lastSound.sound_id);
      if (url) {
        const audio = new Audio(url);
        audio.volume = 0.1;
        audio.play();
      }
    }
  }, [sounds]);
}
