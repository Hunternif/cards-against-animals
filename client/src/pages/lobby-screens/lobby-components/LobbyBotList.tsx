import { User } from 'firebase/auth';
import { Card } from 'react-bootstrap';
import { getAllBots } from '../../../api/users-api';
import { IconAddPerson } from '../../../components/Icons';
import { UserAvatar } from '../../../components/UserAvatar';
import { useAsyncData } from '../../../hooks/data-hooks';
import { CAAUser, GameLobby } from '../../../shared/types';

interface ListProps {
  lobby: GameLobby;
  user: User;
}

/** List of available bots to add to the lobby */
export function LobbyBotList({ lobby, user }: ListProps) {
  const [bots] = useAsyncData(getAllBots());

  return bots?.map((bot) => <PotentialBotCard bot={bot} />);
}

interface CardProps {
  bot: CAAUser;
}

function PotentialBotCard({ bot }: CardProps) {
  return (
    <Card className="player-card potential-bot-card">
      <Card.Body>
        <UserAvatar user={bot} />
        <span className="player-name">{bot.name}</span>
        <span className="right-group"></span>
      </Card.Body>
    </Card>
  );
}
