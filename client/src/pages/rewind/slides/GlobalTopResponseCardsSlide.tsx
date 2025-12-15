import { motion } from 'framer-motion';
import { PopularCardsDisplay } from '../components/PopularCardsDisplay';
import { AnimatedCounter } from '../AnimatedCounter';
import { SlideProps } from './SlideProps';

export function GlobalTopResponseCardsSlide({ statsContainer }: SlideProps) {
  const allUsers = statsContainer.yearMap.get('all_time')?.userStats ?? [];

  // Aggregate all top cards played from all users
  const cardMap = new Map<string, { card: any; count: number }>();

  for (const user of allUsers) {
    for (const item of user.top_cards_played.slice(0, 10)) {
      const key = item.card.content;
      if (cardMap.has(key)) {
        const existing = cardMap.get(key)!;
        existing.count += item.count;
      } else {
        cardMap.set(key, {
          card: item.card,
          count: item.count,
        });
      }
    }
  }

  const topCards = Array.from(cardMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="slide-content slide-global-top-response-cards">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Everyone's Favorites</h2>
        <p className="subtitle">Most played response cards across all players</p>
      </motion.div>

      {topCards.length > 0 && (
        <PopularCardsDisplay
          cards={topCards}
          isPrompt={false}
          maxCards={10}
          title="Popular Responses"
        />
      )}

      {/* {allUsers.length > 0 && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          These were the most popular response cards among{' '}
          <strong>
            <AnimatedCounter
              value={allUsers.filter(u => !u.is_bot).length}
              delay={1.2}
            />
          </strong>{' '}
          players
        </motion.p>
      )} */}
    </div>
  );
}
