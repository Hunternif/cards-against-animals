import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';
import { Twemoji } from '../../../components/Twemoji';

export function IntroSlide({ user }: SlideProps) {
  return (
    <div className="slide-content slide-intro">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="intro-content"
      >
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
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
