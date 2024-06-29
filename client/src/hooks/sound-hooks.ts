import { useEffect, useState } from 'react';
import pop from '../assets/sounds/pop.mp3';
import { useGameContext } from '../pages/lobby-screens/game-components/GameContext';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getSoundsRef, playSoundEvent } from '../api/turn/turn-sound-api';
import { onSnapshot } from 'firebase/firestore';

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
  // TODO: stop playing previous sound form the current player.
  // TODO: play only new sounds on page reload
  useEffect(() => {
    if (sounds && sounds.length > 0) {
      const soundsByTime = sounds
        .slice()
        .sort((a, b) => (a.time?.getTime() ?? 0) - (b.time?.getTime() ?? 0));
      const lastSound = soundsByTime[soundsByTime.length - 1];
      playSoundEvent(lastSound);
    }
  }, [sounds]);
}
