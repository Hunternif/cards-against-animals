import confetti from 'canvas-confetti';
import { useEffect, useRef, useState } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import {
  getSoundsRef,
  playSoundEvent,
  playSoundID,
  soundYikes,
} from '../api/sound-api';
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

const deerIntervalMs = 500;
const deerSize = 7;
let isDeerInitialized = false;
let deerConfetti: confetti.Shape;

function initiaizeDeer() {
  // This fixes error on browsers that don't support OffscreenCanvas:
  if (typeof OffscreenCanvas !== 'undefined') {
    deerConfetti = confetti.shapeFromText({ text: '🦌', scalar: deerSize });
  }
  isDeerInitialized = true;
}

/** Plays a sound whenever someone uses the soundoard */
export function useSoundboardSound() {
  const { lobby, turn } = useGameContext();
  const [sounds] = useCollectionData(getSoundsRef(lobby.id));
  const audioPerPlayer = useRef(new Map<string, HTMLAudioElement | null>());
  const lastDeerTime = useRef(new Date());

  // TODO: play only new sounds on page reload
  useEffect(() => {
    playSounds();
    async function playSounds() {
      if (sounds && sounds.length > 0) {
        const soundsByTime = sounds
          .slice()
          .sort((a, b) => a.time.getTime() - b.time.getTime());
        const newSound = soundsByTime[soundsByTime.length - 1];

        // Ignore sounds from previous turns or phases:
        if (newSound.time.getTime() < turn.phase_start_time.getTime()) {
          return;
        }

        audioPerPlayer.current.get(newSound.player_uid)?.pause();
        const audio = await playSoundEvent(newSound);
        audioPerPlayer.current.set(newSound.player_uid, audio);

        // Sike! confetti effects
        // TODO: move this into another module, using events?
        const now = new Date();
        if (now.getTime() - lastDeerTime.current.getTime() > deerIntervalMs) {
          lastDeerTime.current = now;
          if (newSound.sound_id === soundYikes) {
            if (!isDeerInitialized) {
              initiaizeDeer();
            }
            if (deerConfetti) {
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
      }
    }
  }, [sounds]);
}

interface SoundOptions {
  volume?: number;
  /**
   * By default the sound will stop when going to the next page.
   * If `playUntilEnd = true`, sound will play until the end without stopping.
   */
  playUntilEnd?: boolean;
  /**
   * If more than `threshold` [ms] has passed since the start of playback,
   * sound will not start again. This sets the start time.
   */
  startTime?: Date;
  /**
   * If more than `threshold` [ms] has passed since the start of playback,
   * sound will not start again. This sets the threshold. Default is 3000.
   */
  startThresholdMs?: number;
  /** Controls whether to play the sound. */
  enabled?: boolean;
}

/**
 * Plays this sound once on the page.
 * If you open this page for the first time without interacting,
 * Chrome will block audio playback.
 * Use the returned 'retry' function to retry.
 */
export function useSound(
  soundID: string | undefined,
  options: SoundOptions = {},
): { soundError: any; retrySound: () => void } {
  const [soundError, setSoundError] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSoundIDRef = useRef('');

  /** Returns the 'unsubscribe' function */
  async function tryPlaySound(
    soundID: string,
    options: SoundOptions,
  ): Promise<Function | undefined> {
    if (options.startTime) {
      const now = new Date().getTime();
      const expiryTime =
        options.startTime.getTime() + (options.startThresholdMs ?? 3000);
      if (now > expiryTime) {
        // Too much time has passed since 'startTime', don't play.
        return;
      }
    }
    try {
      setSoundError(null);
      currentSoundIDRef.current = soundID;
      const audio = await playSoundID(soundID, options.volume);
      audioRef.current = audio;
    } catch (e: any) {
      setSoundError(e);
    }
  }

  useEffect(() => {
    if (options.enabled === false) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }
    if (soundID == null) return;
    if (currentSoundIDRef.current != soundID) {
      tryPlaySound(soundID, options);
    }
    if (audioRef.current && options.volume) {
      audioRef.current.volume = options.volume;
    }
    return () => {
      if (audioRef.current && !options.playUntilEnd) {
        audioRef.current.pause();
      }
    };
  }, [
    soundID,
    options.enabled,
    options.startTime,
    options.startThresholdMs,
    options.volume,
  ]);

  return {
    soundError,
    retrySound: () => {
      currentSoundIDRef.current = '';
      audioRef.current = null;
      if (soundID) {
        tryPlaySound(soundID, options);
      }
    },
  };
}

/**
 * Plays a notification sound once when a condition becomes true.
 * Useful for notifying the user when it's their turn or when an event occurs.
 */
export function useNotificationSound(
  soundFile: string,
  shouldPlay: boolean,
): void {
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (shouldPlay && !hasNotified) {
      new Audio(soundFile).play();
      setHasNotified(true);
    }
  }, [soundFile, shouldPlay, hasNotified]);
}
