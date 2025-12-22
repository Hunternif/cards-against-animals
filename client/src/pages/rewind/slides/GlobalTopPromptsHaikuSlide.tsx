import { motion } from 'framer-motion';
import { PopularCardsDisplay } from '../components/PopularCardsDisplay';
import { SlideProps } from './SlideProps';
import { useState } from 'react';
import meme from '../../../assets/always_has_been_haiku.png';

export function GlobalTopPromptsHaikuSlide({ statsContainer }: SlideProps) {
  const globalStats = statsContainer.yearMap.get('all_time')?.globalStats;
  const topHaikus =
    globalStats?.top_prompts?.filter((c) => c.prompt.id.startsWith('haiku')) ??
    [];
  const [showMeme, setShowMeme] = useState(false);

  return (
    <div className="slide-content slide-global-top-prompts">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Toughest Questions</h2>
        <p className="subtitle">Most played prompts across all players</p>
      </motion.div>

      {topHaikus.length > 0 && (
        <PopularCardsDisplay
          cards={topHaikus}
          isPrompt={true}
          maxCards={10}
          excludeOnes
          onRevealAll={() => setShowMeme(true)}
          // style={{ minHeight: 500 }}
        />
      )}

      {showMeme && (
        <motion.div
          style={{
            position: 'absolute',
            zIndex: 99,
            opacity: 0.7,
          }}
          initial={{ top: '-400px' }}
          animate={{ top: '110vh' }}
          transition={{ delay: 0, duration: 10, ease: 'linear' }}
          onAnimationComplete={() => setShowMeme(false)}
          className="meme"
        >
          <img
            src={meme}
            style={{
              maxWidth: 'calc(100vw - 16px)',
              // maxHeight: 'calc(100vh - 16px)',
              // width: '200%',
              // marginLeft: '10%',
              borderRadius: 8,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
