import { ResponseCardInGame, ResponseCardStats } from '@shared/types';
import { motion } from 'framer-motion';
import { CardStack } from '../../lobby-screens/game-components/CardStack';
import Carousel from '../Carousel';
import { SlideProps } from './SlideProps';

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

export function TopResponsesSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Carousel>
            {/* TODO count total likes! */}
            {stats.top_liked_responses.map(
              ({ cards, normalized_likes, lobby_size }, i) => (
                <div key={i}>
                  <CardStack
                    showLikes
                    // TODO: include prompt
                    // cards={[answer.prompt, ...answer.response.cards]}
                    cards={cards.map(toCardInGame)}
                    likeCount={Math.round(normalized_likes * lobby_size)}
                  />
                </div>
              ),
            )}
          </Carousel>
        </motion.div>
      )}
    </div>
  );
}
