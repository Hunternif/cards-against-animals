import { CSSProperties, useContext } from 'react';
import { usePromptVotes } from '../../../api/turn/turn-hooks';
import { votePrompt } from '../../../api/turn/turn-vote-card-api';
import { ErrorContext } from '../../../components/ErrorContext';
import { PlayerAvatar } from '../../../components/PlayerAvatar';
import { Twemoji } from '../../../components/Twemoji';
import { useDIContext } from '../../../di-context';
import { useAsyncData } from '../../../hooks/data-hooks';
import { formatPrompt } from '@shared/deck-utils';
import { PromptCardInGame, VoteChoice } from '@shared/types';
import { copyFields2 } from '@shared/utils';
import { Downvote, Upvote } from './CardVotes';
import { useGameContext } from './GameContext';
import {
  CardBottom,
  CardBottomLeft,
  CardBottomRight,
  CardCenterIcon,
  CardContent,
  LargeCard,
} from './LargeCard';

interface PromptCardProps {
  /** Undefined while the judge hasn't picked a prompt yet */
  card: PromptCardInGame | undefined | null;
  canVote?: boolean;
  canSelect?: boolean;
  selected?: boolean;
  showDeckName?: boolean;
  onClick?: () => void;
}

export function CardPrompt(props: PromptCardProps) {
  if (props.card) {
    const newProps = copyFields2(props, { card: props.card });
    return <KnownPrompt {...newProps} />;
  } else {
    return <UnknownPrompt />;
  }
}

interface KnownPromptCardProps extends PromptCardProps {
  card: PromptCardInGame;
}

/** Prompt that exists (has been chosen and loaded). */
function KnownPrompt({
  card,
  canVote,
  canSelect,
  selected,
  showDeckName,
  onClick,
}: KnownPromptCardProps) {
  const { lobby, turn, player } = useGameContext();
  const { setError } = useContext(ErrorContext);
  const [promptVotes] = usePromptVotes(lobby, turn, card);
  const currentVote = promptVotes?.find((v) => v.player_uid === player.uid);
  const voteClass = currentVote
    ? currentVote.choice === 'yes'
      ? 'upvoted'
      : 'downvoted'
    : '';
  const canSelectClass = canSelect ? 'hoverable-card' : '';
  const selectedClass = selected ? 'selected' : 'unselected';

  async function vote(choice?: VoteChoice) {
    await votePrompt(lobby, turn, card, player, choice).catch((e: any) =>
      setError(e),
    );
  }

  async function handleUpvote() {
    if (currentVote?.choice === 'yes') {
      // toggle to cancel the previous upvote:
      await vote(undefined);
    } else {
      await vote('yes');
    }
  }
  async function handleDownvote() {
    if (currentVote?.choice === 'no') {
      // toggle to cancel the previous downvote:
      await vote(undefined);
    } else {
      await vote('no');
    }
  }
  return (
    <LargeCard
      className={`card-prompt ${voteClass} ${canSelectClass} ${selectedClass}`}
      onClick={onClick}
    >
      <CardContent>{formatPrompt(card.content)}</CardContent>
      <CardBottom>
        {showDeckName && <DeckName deckID={card.deck_id} />}
        {canVote && (
          <CardBottomLeft className="prompt-voting">
            <Upvote onClick={handleUpvote} />
            <Downvote onClick={handleDownvote} />
          </CardBottomLeft>
        )}
        {card.pick > 1 && (
          <CardBottomRight>
            <PromptPick pick={card.pick} />
          </CardBottomRight>
        )}
      </CardBottom>
    </LargeCard>
  );
}

export function PromptPick({ pick }: { pick: number }) {
  return (
    <div className="prompt-pick">
      PICK
      <div className="prompt-pick-number">{pick}</div>
    </div>
  );
}

/** Prompt that hasn't been chosen or hasn't loaded, shows a big "?". */
export function UnknownPrompt() {
  return (
    <LargeCard className="card-prompt">
      <CardCenterIcon className="prompt-unknown-icon">?</CardCenterIcon>
    </LargeCard>
  );
}

const containerStyle: CSSProperties = {
  height: 'auto',
};

/** Displays the prompt card and the current judge name below it. */
export function CardPromptWithCzar(props: PromptCardProps) {
  const { judge, isJudge } = useGameContext();
  return (
    <div className="game-card-placeholder" style={containerStyle}>
      <CardPrompt {...props} />
      {judge && !isJudge && (
        <div
          className="prompt-czar-name"
          title={`${judge.name} is card czar, will select the best answer.`}
        >
          <PlayerAvatar player={judge} />
          <span className="player-name">{judge.name}</span>
          <Twemoji className="icon-czar">👑</Twemoji>
        </div>
      )}
    </div>
  );
}

function DeckName({ deckID }: { deckID?: string }) {
  const { deckRepository } = useDIContext();
  const [decks] = useAsyncData(deckRepository.getDecks([]));
  const deck = decks?.find((d) => d.id === deckID);
  return <div className="prompt-deck-name">{deck?.title}</div>;
}
