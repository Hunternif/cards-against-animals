import {
  PlayerInLobby,
  PromptCardInGame,
  PromptCardStats,
  ResponseCardInGame,
  ResponseCardStats,
} from '@shared/types';
import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { PlayerAvatar } from '../../../components/PlayerAvatar';
import { CardStack } from '../../lobby-screens/game-components/CardStack';
import StripCarousel from './StripCarousel';

function toResponseCardInGame(
  cardStats: ResponseCardStats,
): ResponseCardInGame {
  return new ResponseCardInGame(
    cardStats.id,
    cardStats.deck_id,
    cardStats.card_id_in_deck,
    0,
    cardStats.content,
    0,
    cardStats.tags ?? [],
    cardStats.action,
  );
}

function toPromptCardInGame(cardStats: PromptCardStats): PromptCardInGame {
  return new PromptCardInGame(
    cardStats.id,
    cardStats.deck_id,
    cardStats.card_id_in_deck,
    0,
    cardStats.content,
    cardStats.pick,
    0,
    cardStats.tags ?? [],
  );
}

interface ResponseItem {
  uid?: string;
  prompt: PromptCardStats;
  cards: ResponseCardStats[];
  likes: number;
  normalized_likes: number;
  lobby_size: number;
}

interface PlayerItem {
  uid: string;
  player_in_lobby_refs: PlayerInLobby[];
}

interface PopularResponsesDisplayProps {
  responses: ResponseItem[];
  max?: number;
  showPlayer?: boolean;
  users?: PlayerItem[];
  delay?: number;
}

/** Displays responses in a carousel, revealed when clicked. */
export function PopularResponsesDisplay({
  responses,
  max,
  showPlayer,
  users,
  delay,
}: PopularResponsesDisplayProps) {
  const displayResponses = responses.slice(0, max);
  const [revealCounts, setRevealCounts] = useState(
    displayResponses.map(() => 1),
  );

  function revealResponse(i: number) {
    const newCounts = [...revealCounts];
    newCounts[i]++;
    setRevealCounts(newCounts);
  }

  if (displayResponses.length === 0) {
    return (
      <motion.p
        className="no-data-message"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        No data available
      </motion.p>
    );
  }

  return (
    <StripCarousel style={{ minHeight: 300 }}>
      {displayResponses.map(({ uid, prompt, cards, likes }, i) => {
        const isRevealed = revealCounts[i] >= cards.length + 1;
        const player = users
          ?.find((u) => u.uid === uid)
          ?.player_in_lobby_refs?.at(0);
        return (
          <AnimationWrapper key={i} index={i} animate={true} delay={delay}>
            <CardStack
              showLikes
              animateLikes
              canReveal={!isRevealed}
              revealCount={revealCounts[i]}
              onClick={() => revealResponse(i)}
              cards={[
                toPromptCardInGame(prompt),
                ...cards.map(toResponseCardInGame),
              ]}
              likeCount={likes}
            />
            {showPlayer && (
              <div className="player-name-container">
                {isRevealed && player && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: 0.3 + likes * 0.15,
                      duration: 0.1,
                    }}
                  >
                    <PlayerAvatar player={player} />
                    <span className="player-name">{player.name}</span>
                  </motion.div>
                )}
              </div>
            )}
          </AnimationWrapper>
        );
      })}
    </StripCarousel>
  );
}

interface WrapperProps {
  index: number;
  children: ReactNode;
  animate?: boolean;
  delay?: number;
}
function AnimationWrapper({ index, children, animate, delay }: WrapperProps) {
  if (animate) {
    return (
      <motion.div
        className="response-wrapper"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          delay: (delay ?? 0) + index * 0.15,
          stiffness: 700,
          damping: 20,
        }}
      >
        {children}
      </motion.div>
    );
  } else {
    return <div className="response-wrapper">{children}</div>;
  }
}
