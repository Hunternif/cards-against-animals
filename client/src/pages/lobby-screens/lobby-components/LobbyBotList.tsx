import { User } from 'firebase/auth';
import { Card } from 'react-bootstrap';
import { addBotToLobby } from '../../../api/lobby/lobby-join-api';
import { getAllBots } from '../../../api/users-api';
import { IconAddPerson } from '../../../components/Icons';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { UserAvatar } from '../../../components/UserAvatar';
import { useAsyncData, useHandler1 } from '../../../hooks/data-hooks';
import { CAAUser, GameLobby, PlayerInLobby } from '../../../shared/types';

interface ListProps {
  lobby: GameLobby;
  players: PlayerInLobby[];
  user: User;
}

/** List of available bots to add to the lobby */
export function LobbyBotList({ lobby, players, user }: ListProps) {
  const [bots] = useAsyncData(getAllBots());
  const playerIDs = players.map((p) => p.uid);
  const availableBots = (bots ?? []).filter(
    (bot) => !playerIDs.includes(bot.uid),
  );

  const [handleClick, addingBot] = useHandler1(
    async (bot: CAAUser) => {
      await addBotToLobby(lobby.id, bot.uid);
    },
    [lobby, user],
  );

  return availableBots.map((bot) => (
    <PotentialBotCard bot={bot} adding={addingBot} onClick={handleClick} />
  ));
}

interface CardProps {
  bot: CAAUser;
  adding?: boolean;
  onClick: (bot: CAAUser) => void;
}

function PotentialBotCard({ bot, adding, onClick }: CardProps) {
  const classes = ['player-card potential-bot-card'];
  if (adding) classes.push('adding');
  return (
    <Card className={classes.join(' ')} onClick={() => onClick(bot)}>
      <Card.Body>
        <UserAvatar user={bot} />
        <span className="player-name">{bot.name}</span>
        <span className="right-group">
          {adding ? <LoadingSpinner inline /> : <IconAddPerson />}
        </span>
      </Card.Body>
    </Card>
  );
}
