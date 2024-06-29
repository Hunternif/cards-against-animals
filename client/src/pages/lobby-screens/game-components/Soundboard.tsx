import { CSSProperties, useContext } from 'react';
import {
  postSoundEvent,
  soundBruh,
  soundClownHonk,
  soundCum,
  soundMcUh,
  soundWow,
  soundYikes,
} from '../../../api/turn/turn-sound-api';
import { GameButton } from '../../../components/Buttons';
import { useGameContext } from './GameContext';
import { ErrorContext } from '../../../components/ErrorContext';
import { Twemoji } from '../../../components/Twemoji';

const style: CSSProperties = {
  display: 'flex',
  gap: '0.5em',
  opacity: '50%',
};

export function Soundboard() {
  const { lobby, turn, player } = useGameContext();
  const { setError } = useContext(ErrorContext);

  async function handleSound(soundID: string) {
    try {
      await postSoundEvent(lobby, turn, player, soundID);
    } catch (e: any) {
      setError(e);
    }
  }

  return (
    <div className="soundboard" style={style}>
      <GameButton onClick={() => handleSound(soundBruh)}>
        <Twemoji>🙄</Twemoji>
      </GameButton>
      <GameButton onClick={() => handleSound(soundClownHonk)}>
        <Twemoji>🤡</Twemoji>
      </GameButton>
      <GameButton onClick={() => handleSound(soundCum)}>
        <Twemoji>💧</Twemoji>
      </GameButton>
      <GameButton onClick={() => handleSound(soundMcUh)}>
        <Twemoji>💀</Twemoji>
      </GameButton>
      <GameButton onClick={() => handleSound(soundWow)}>
        <Twemoji>✨</Twemoji>
      </GameButton>
      <GameButton onClick={() => handleSound(soundYikes)}>
        <Twemoji>🦌</Twemoji>
      </GameButton>
    </div>
  );
}
