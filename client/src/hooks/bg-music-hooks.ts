import { useEffect, useRef } from 'react';
import { playSoundID, randomBgm } from '../api/sound-api';

// Global state to prevent multiple instances from playing simultaneously
const globalBgmState = {
  isPlaying: false,
  lockAcquired: false,
};

/**
 * Hook to play a random background song
 * @param enabled Whether the background music should play
 * @param volume Volume level (0.0 to 1.0)
 */
export function useBackgroundMusic(
  enabled: boolean = true,
  volume: number = 0.1,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const hasGlobalLockRef = useRef<boolean>(false);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (hasGlobalLockRef.current) {
      globalBgmState.isPlaying = false;
      hasGlobalLockRef.current = false;
    }
  };

  const startRandomBackgroundMusic = async () => {
    // Prevent duplicate calls
    if (globalBgmState.isPlaying || globalBgmState.lockAcquired || !isMountedRef.current) {
      return;
    }
    
    // Acquire global lock FIRST before any async operations
    globalBgmState.lockAcquired = true;
    globalBgmState.isPlaying = true;
    hasGlobalLockRef.current = true;
    
    // Use current minute so that all players hear the same track
    const seed = Math.floor(Date.now() / 60000);
    const selectedTrack = randomBgm(seed);
    
    try {
      const audio = await playSoundID(selectedTrack, volume);
      if (!isMountedRef.current) {
        audio?.pause();
        globalBgmState.isPlaying = false;
        globalBgmState.lockAcquired = false;
        hasGlobalLockRef.current = false;
        return;
      }
      if (audio) {
        audioRef.current = audio;
        globalBgmState.lockAcquired = false;

        audio.onended = () => {
          if (!isMountedRef.current) return;
          audioRef.current = null;
          globalBgmState.isPlaying = false;
          hasGlobalLockRef.current = false;
          startRandomBackgroundMusic();
        };
      } else {
        globalBgmState.isPlaying = false;
        globalBgmState.lockAcquired = false;
        hasGlobalLockRef.current = false;
      }
    } catch (error) {
      console.error('Failed to play background music:', error);
      globalBgmState.isPlaying = false;
      globalBgmState.lockAcquired = false;
      hasGlobalLockRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    if (enabled) {
      startRandomBackgroundMusic();
    } else if (audioRef.current) {
      stopPlayback();
    }

    return () => {
      isMountedRef.current = false;
      stopPlayback();
    };
  }, [enabled, volume]);

  return {
    isPlaying: globalBgmState.isPlaying,
    stop: stopPlayback,
  };
}
