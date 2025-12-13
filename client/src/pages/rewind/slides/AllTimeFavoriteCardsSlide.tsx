import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';

export function AllTimeFavoriteCardsSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;

  if (!stats) {
    return <div className="slide-content">No data available</div>;
  }

  const topCards = stats.top_cards_played.slice(0, 3);
  const topLikedResponses = stats.top_liked_responses.slice(0, 1);

  return (
    <div className="slide-content slide-all-time-cards">
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
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Most Played
          </motion.h3>
          {topCards.map((item, index) => (
            <motion.div
              key={item.card.id}
              className="card-item"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.15 }}
            >
              <div className="card-text">"{item.card.content}"</div>
              <div className="card-count">Played {item.count}x</div>
            </motion.div>
          ))}
        </div>
      )}

      {topLikedResponses.length > 0 && topLikedResponses[0].cards.length > 0 && (
        <motion.div
          className="most-liked-section"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <h3>Your Most Liked Response</h3>
          <div className="liked-response-card highlight">
            {topLikedResponses[0].cards.map((card, idx) => (
              <div key={idx} className="response-text">
                "{card.content}"
              </div>
            ))}
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
          transition={{ delay: 1.3 }}
        >
          You discarded {stats.total_discards} cards looking for the perfect answer
        </motion.p>
      )}
    </div>
  );
}
