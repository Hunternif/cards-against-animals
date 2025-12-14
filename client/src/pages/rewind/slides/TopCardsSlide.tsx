import { motion } from 'framer-motion';
import { useState } from 'react';
import { ResponseCardInGame, ResponseCardStats } from '@shared/types';
import { CardStack } from '../../lobby-screens/game-components/CardStack';
import { SlideProps } from './SlideProps';
import { AnimatedCounter } from '../AnimatedCounter';

function toCardInGame(cardStats: ResponseCardStats): ResponseCardInGame {
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

export function TopCardsSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;
  const topCards = stats.top_cards_played.slice(0, 7);
  const [revealCount, setRevealCount] = useState(0);

  return (
    <div className="slide-content slide-top-cards">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Your Favorite Cards</h2>
      </motion.div>

      {topCards.length > 0 && (
        <div className="cards-section">
          <div className="rewind-card-stack-container">
            <motion.div
              className="rewind-card-wrapper"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <CardStack
                animate
                animDelay={0.6}
                cards={topCards.map(({ card }) => toCardInGame(card))}
                canReveal={revealCount < topCards.length}
                revealCount={revealCount}
                onClick={() => setRevealCount(revealCount + 1)}
              />
              {/* <div className="card-count">Played {item.count}x</div> */}
            </motion.div>
          </div>
        </div>
      )}

      {stats.total_discards > 0 && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + 0.2 * topCards.length }}
        >
          You discarded{' '}
          <strong>
            <AnimatedCounter
              value={stats.total_discards}
              delay={0.7 + 0.2 * topCards.length}
            />
          </strong>{' '}
          cards looking for the perfect answer
        </motion.p>
      )}
    </div>
  );
}
