import { useCallback, useEffect, useRef } from 'react';
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
  /** If set, will play this tracklist on loop.
   * Otherwise will pick a random BGM based on current time. */
  trackList?: string[],
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const hasGlobalLockRef = useRef<boolean>(false);
  const currentTrackIndex = useRef<number>(-1);

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

  const selectNextTrack = useCallback(() => {
    if (trackList) {
      let index = currentTrackIndex.current + 1;
      if (index >= trackList.length) {
        index = 0;
      }
      currentTrackIndex.current = index;
      return trackList[index];
    } else {
      // Use current minute so that all players hear the same track
      const seed = Math.floor(Date.now() / 60000);
      return randomBgm(seed);
    }
  }, [trackList]);

  const startNextTrack = async () => {
    // Prevent duplicate calls
    if (globalBgmState.isPlaying || globalBgmState.lockAcquired || !isMountedRef.current) {
      return;
    }
    
    // Acquire global lock FIRST before any async operations
    globalBgmState.lockAcquired = true;
    globalBgmState.isPlaying = true;
    hasGlobalLockRef.current = true;
    
    const selectedTrack = selectNextTrack();
    
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
          startNextTrack();
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
      startNextTrack();
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
