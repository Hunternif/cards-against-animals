import {
  useResponseLikeCount,
  useResponseMyLike,
  useResponseReveal,
} from '../../../api/turn/turn-hooks';
import { PlayerAvatar } from '../../../components/PlayerAvatar';
import { PlayerInLobby, PlayerResponse } from '../../../shared/types';
import { CardStack } from './CardStack';
import { useGameContext } from './GameContext';
import { LaughTrack } from './LaughTrack';

interface Props {
  player?: PlayerInLobby;
  response: PlayerResponse;
  /** Only the judge player can reveal */
  canReveal?: boolean;
  /** When selecting winner */
  canSelect?: boolean;
  selected?: boolean;
  onClick?: (response: PlayerResponse) => void;
  /** Players other than the judge can like the response. */
  canLike?: boolean;
  onClickLike?: (response: PlayerResponse) => void;
  showLikes?: boolean;
  showName?: boolean;
  laughOnReveal?: boolean;
}

/**
 * Vertical card stack for a single response.
 * Used in the "reading" phase, when the judge reveals player responses one by one.
 * Optionally displays player's name.
 */
export function ResponseReading({
  response,
  laughOnReveal,
  onClick,
  onClickLike,
  ...props
}: Props) {
  const { lobby, turn, player } = useGameContext();
  const revealed = useResponseReveal(response);
  const likes = useResponseLikeCount(lobby, turn, response);
  const hasMyLike = useResponseMyLike(lobby, turn, response, player.uid);

  return (
    <>
      {revealed && laughOnReveal && (
        <LaughTrack response={response} likes={likes} />
      )}
      {props.showName ? (
        <div className="game-card-placeholder" style={{ height: 'auto' }}>
          <CardStack
            {...props}
            likeCount={likes}
            hasMyLike={hasMyLike}
            cards={response.cards}
            revealCount={response.reveal_count}
            onClick={() => onClick && onClick(response)}
            onClickLike={() => onClickLike && onClickLike(response)}
          />
          <div
            className="response-player-name"
            style={{
              width: '100%',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {props.player && <PlayerAvatar player={props.player} />}
            <span className="player-name">{response.player_name}</span>
          </div>
        </div>
      ) : (
        <CardStack
          {...props}
          likeCount={likes}
          hasMyLike={hasMyLike}
          cards={response.cards}
          revealCount={response.reveal_count}
          onClick={() => onClick && onClick(response)}
          onClickLike={() => onClickLike && onClickLike(response)}
        />
      )}
    </>
  );
}
