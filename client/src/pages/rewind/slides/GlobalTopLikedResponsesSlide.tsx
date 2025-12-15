import {
  PromptCardInGame,
  PromptCardStats,
  ResponseCardInGame,
  ResponseCardStats,
} from '@shared/types';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { CardStack } from '../../lobby-screens/game-components/CardStack';
import StripCarousel from '../StripCarousel';
import { SlideProps } from './SlideProps';

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

interface AggregatedLikedResponse {
  prompt: PromptCardStats;
  cards: ResponseCardStats[];
  likes: number;
  normalized_likes: number;
  lobby_size: number;
}

export function GlobalTopLikedResponsesSlide({ statsContainer }: SlideProps) {
  // Use global stats directly for most liked responses
  const globalStats = statsContainer.yearMap.get('all_time')?.globalStats;
  const topLikedResponses = globalStats?.top_liked_responses ?? [];

  const [revealCounts, setRevealCounts] = useState(
    topLikedResponses.map(() => 1),
  );

  function revealResponse(i: number) {
    const newCounts = [...revealCounts];
    newCounts[i]++;
    setRevealCounts(newCounts);
  }

  return (
    <div className="slide-content slide-global-top-liked-responses">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Most Liked Answers</h2>
        <p className="subtitle">Responses that got the most likes</p>
      </motion.div>

      {topLikedResponses.length > 0 && (
        <motion.div
          className="most-liked-section"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.5,
            type: 'spring',
            stiffness: 700,
            damping: 20,
          }}
        >
          <StripCarousel style={{ minHeight: 300 }}>
            {topLikedResponses.map(({ prompt, cards, likes }, i) => (
              <CardStack
                key={i}
                showLikes
                animateLikes
                canReveal={revealCounts[i] < cards.length + 1}
                revealCount={revealCounts[i]}
                onClick={() => revealResponse(i)}
                cards={[
                  toPromptCardInGame(prompt),
                  ...cards.map(toResponseCardInGame),
                ]}
                likeCount={likes}
              />
            ))}
          </StripCarousel>
        </motion.div>
      )}

      {topLikedResponses.length === 0 && (
        <motion.p
          className="no-data-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          No liked responses data available yet
        </motion.p>
      )}
    </div>
  );
}
