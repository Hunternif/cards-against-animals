import {
  PromptCardInGame,
  PromptCardStats,
  ResponseCardInGame,
  ResponseCardStats,
  UserStats,
} from '@shared/types';
import { motion } from 'framer-motion';
import { CardStack } from '../../lobby-screens/game-components/CardStack';
import Carousel from '../Carousel';
import { SlideProps } from './SlideProps';
import { useState } from 'react';

function toPromptCardInGame(cardStats: PromptCardStats): PromptCardInGame {
  return new PromptCardInGame(
    cardStats.id,
    cardStats.deck_id,
    cardStats.card_id_in_deck,
    0, // random_index - not needed for display
    cardStats.content,
    cardStats.pick,
    0, // rating - not needed for display
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
    0, // random_index - not needed for display
    cardStats.content,
    0, // rating - not needed for display
    cardStats.tags ?? [],
    cardStats.action,
  );
}

export function TopResponsesSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;
  // Track of reveals for every card
  const [revealCounts, setRevealCounts] = useState(
    stats.top_liked_responses.map(() => 1),
  );

  function revealResponse(i: number) {
    const newCounts = [...revealCounts];
    newCounts[i]++;
    setRevealCounts(newCounts);
  }

  return (
    <div className="slide-content slide-top-responses">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Your Top Responses</h2>
      </motion.div>

      {stats.top_liked_responses.length > 0 && (
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
          <Carousel style={{ minHeight: 300 }}>
            {stats.top_liked_responses.map(({ prompt, cards, likes }, i) => (
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
          </Carousel>
        </motion.div>
      )}
    </div>
  );
}
