import { motion } from 'framer-motion';
import { useState } from 'react';
import { ResponseCardInGame } from '@shared/types';
import { CardStack } from '../../lobby-screens/game-components/CardStack';
import { SlideProps } from './SlideProps';

export function TopResponsesSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;
  const topCards = stats.top_cards_played.slice(0, 3);
  const topLikedResponses = stats.top_liked_responses.slice(0, 1);

  // Track reveal state for each card stack
  const [likedResponseReveal, setLikedResponseReveal] = useState(0);

  // Convert ResponseCardStats to CardInGame
  function toCardInGame(cardStats: typeof topCards[0]['card']): ResponseCardInGame {
    return new ResponseCardInGame(
      cardStats.id,
      cardStats.deck_id,
      cardStats.card_id_in_deck,
      0, // random_index - not needed for display
      cardStats.content,
      0, // rating - not needed for display
      cardStats.tags ?? [],
      cardStats.action
    );
  }

  function handleRevealLikedResponse() {
    if (topLikedResponses[0]) {
      setLikedResponseReveal((prev) => 
        Math.min(prev + 1, topLikedResponses[0].cards.length)
      );
    }
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

      {topLikedResponses.length > 0 && topLikedResponses[0].cards.length > 0 && (
        <motion.div
          className="most-liked-section"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="rewind-card-wrapper highlight">
            <CardStack
              cards={topLikedResponses[0].cards.map(toCardInGame)}
              canReveal={likedResponseReveal < topLikedResponses[0].cards.length}
              revealCount={likedResponseReveal}
              onClick={handleRevealLikedResponse}
            />
            <div className="likes-count">
              ❤️ {topLikedResponses[0].normalized_likes.toFixed(1)} likes
            </div>
          </div>
        </motion.div>
      )}

      {stats.total_discards > 0 && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          You discarded {stats.total_discards} cards looking for the perfect answer
        </motion.p>
      )}
    </div>
  );
}
