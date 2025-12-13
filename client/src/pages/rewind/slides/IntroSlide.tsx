import { AnimatePresence, motion } from 'framer-motion';
import { Twemoji } from '../../../components/Twemoji';
import { SlideProps } from './SlideProps';

export function IntroSlide({ user }: SlideProps) {
  return (
    <div className="slide-content slide-intro">
      <motion.div className="intro-content">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Hey {user.displayName || 'there'}! <Twemoji>👋</Twemoji>
        </motion.h1>

        <motion.p
          className="intro-subtitle"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Let's look back at your year
        </motion.p>

        <motion.div
          className="year-badges"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <span className="year-badge">2024</span>
          <span className="year-badge">2025</span>
        </motion.div>

        <motion.p
          className="intro-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          Swipe up or press ↓ to continue
        </motion.p>
      </motion.div>
    </div>
  );
}
