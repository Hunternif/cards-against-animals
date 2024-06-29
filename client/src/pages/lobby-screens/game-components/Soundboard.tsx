import { useContext } from 'react';
import { postSound } from '../../../api/turn/turn-sound-api';
import { GameButton } from '../../../components/Buttons';
import { useGameContext } from './GameContext';
import { ErrorContext } from '../../../components/ErrorContext';

export function Soundboard() {
  const { lobby, turn, player } = useGameContext();
  const { setError } = useContext(ErrorContext);

  async function handleSoundYikes() {
    try {
      await postSound(lobby, turn, player, 'yikes');
    } catch (e: any) {
      setError(e);
    }
  }

  return <GameButton onClick={handleSoundYikes}>Yikes!</GameButton>;
}
