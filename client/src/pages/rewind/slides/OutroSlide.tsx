import confetti from 'canvas-confetti';
import { delay, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Twemoji } from '../../../components/Twemoji';
import { SlideProps } from './SlideProps';

function launchConfetti() {
  confetti({
    ticks: 200,
    particleCount: 100,
  });
}

export function OutroSlide({ userStats }: SlideProps) {
  const navigate = useNavigate();
  const stats = userStats.allTime;

  return (
    <div className="slide-content slide-outro">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        onAnimationStart={() => delay(launchConfetti, 500)}
        className="outro-content"
      >
        <motion.div
          className="confetti-icon"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
        >
          <Twemoji>🎉</Twemoji>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          That's a wrap!
        </motion.h2>

        <motion.p
          className="outro-message"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {stats.total_games > 0 ? (
            <>
              You've played <strong>{stats.total_games}</strong> games and made{' '}
              <strong>{stats.total_wins}</strong> winning plays.
              <br />
              Here's to many more laughs in 2026!
            </>
          ) : (
            <>Thanks for checking out your rewind!</>
          )}
        </motion.p>

        <motion.div
          className="outro-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <button className="go-back" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </motion.div>

        <motion.p
          className="outro-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          Swipe down or press ↑ to go back
        </motion.p>
      </motion.div>
    </div>
  );
}
