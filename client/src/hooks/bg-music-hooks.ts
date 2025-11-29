import { useEffect, useRef } from 'react';
import { playSoundID, randomBgm } from '../api/sound-api';

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
  const currentSongRef = useRef<string | null>(null);

  useEffect(() => {
    // Only start playing if enabled and no current song is playing
    if (enabled && !currentSongRef.current) {
      startRandomBackgroundMusic();
    }

    // If disabled and a song is playing, stop it
    if (!enabled && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      currentSongRef.current = null;
    }

    async function startRandomBackgroundMusic() {
      // use current minute so that all players hear the same track:
      const seed = Math.floor(Date.now() / 60000);
      const selectedTrack = randomBgm(seed);
      try {
        const audio = await playSoundID(selectedTrack, volume);
        if (audio) {
          audioRef.current = audio;
          currentSongRef.current = selectedTrack;

          // When the song ends, queue the next song
          audio.onended = () => {
            audioRef.current = null;
            currentSongRef.current = null;
            startRandomBackgroundMusic();
          };
        }
      } catch (error) {
        console.error('Failed to play background music:', error);
      }
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        currentSongRef.current = null;
      }
    };
  }, [enabled, volume]);

  return {
    isPlaying: !!currentSongRef.current,
    currentSong: currentSongRef.current,
    stop: () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        currentSongRef.current = null;
      }
    },
  };
}
