import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';
import { EmojiWave } from '../EmojiWave';
import { IconCatWithEyes } from '../../../components/Icons';

export function GlobalIntroSlide({}: SlideProps) {
  return (
    <div className="slide-content slide-global-intro">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <EmojiWave
          delay={1}
          emojis={[
            ['🦌', 1],
            ['', 10],
            [<IconCatWithEyes />, 1],
            ['', 10],
            ['👀', 1],
          ]}
        />
      </motion.div>
      <motion.div className="intro-content">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          How did everyone else do?
        </motion.h1>

        <motion.p
          className="intro-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
        >
          Swipe up or press ↓ to continue
        </motion.p>
      </motion.div>
    </div>
  );
}
