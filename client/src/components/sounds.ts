import { useEffect, useState } from 'react';
import pop from '../assets/sounds/pop.mp3';
import { useGameContext } from "../pages/lobby-screens/game-components/GameContext";

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