import { User } from 'firebase/auth';
import { GameButton } from './Buttons';
import { Twemoji } from './Twemoji';
import { useNavigate } from 'react-router-dom';

interface Props {
  user: User;
}

export function RewindButton({ user }: Props) {
  const navigate = useNavigate();
  if (user) {
    // TODO: check that user stats exist!
    return (
      <GameButton
        className="rewind-button"
        onClick={() => navigate('/rewind')}
        iconLeft={<Twemoji>✨</Twemoji>}
      >
        See your Rewind
      </GameButton>
    );
  } else {
    return null;
  }
}
