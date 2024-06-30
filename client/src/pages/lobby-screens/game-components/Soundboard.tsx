import { CSSProperties, useContext } from 'react';
import {
  postSoundEvent,
  soundBruh,
  soundClownHonk,
  soundCum,
  soundMcUh,
  soundWow,
  soundYikes,
} from '../../../api/sound-api';
import { GameButton } from '../../../components/Buttons';
import { ErrorContext } from '../../../components/ErrorContext';
import { Twemoji } from '../../../components/Twemoji';
import { useGameContext } from './GameContext';

const style: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '0.5em',
  opacity: '0.3',
  flexBasis: '100%',
};

export function Soundboard() {
  const { lobby, player, isSpectator } = useGameContext();
  const { setError } = useContext(ErrorContext);

  async function handleSound(soundID: string) {
    try {
      await postSoundEvent(lobby, player, soundID);
    } catch (e: any) {
      setError(e);
    }
  }

  if (isSpectator || !lobby.settings.enable_soundboard) return null;

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
