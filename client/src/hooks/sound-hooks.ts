import { useEffect, useRef, useState } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getSoundsRef, playSoundEvent, soundYikes } from '../api/sound-api';
import pop from '../assets/sounds/pop.mp3';
import { useGameContext } from '../pages/lobby-screens/game-components/GameContext';
import confetti from 'canvas-confetti';

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

const deerIntervalMs = 500;
const deerSize = 7;
const deerConfetti = confetti.shapeFromText({ text: '🦌', scalar: deerSize });

/** Plays a sound whenever someone uses the soundoard */
export function useSoundboardSound() {
  const { lobby } = useGameContext();
  const [sounds] = useCollectionData(getSoundsRef(lobby.id));
  const audioPerPlayer = useRef(new Map<string, HTMLAudioElement | null>());
  const lastDeerTime = useRef(new Date());

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

      // Sike! confetti effects
      // TODO: move this into another module, using events?
      const now = new Date();
      if (now.getTime() - lastDeerTime.current.getTime() > deerIntervalMs) {
        lastDeerTime.current = now;
        if (newSound.sound_id === soundYikes) {
          confetti({
            shapes: [deerConfetti],
            flat: true, // this exists, but @types are outdated
            scalar: deerSize,
            spread: 180,
            particleCount: 6,
            startVelocity: 30,
            ticks: 30,
          } as confetti.Options);
        }
      }
    }
  }, [sounds]);
}
