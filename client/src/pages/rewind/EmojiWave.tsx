import { AnimatePresence, motion, Variants } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { useDelay } from '../../components/Delay';
import { IconCatWithEyes } from '../../components/Icons';
import { Twemoji } from '../../components/Twemoji';

function buildWaves(rowWidth: number, ...items: [ReactNode, number][]) {
  const waves = new Array<Array<ReactNode>>();
  let buffer: Array<ReactNode> = [];
  let total = 0;
  items.forEach(([item, count], i) => {
    for (let j = 0; j < count; j++) {
      total++;
      buffer.push(item);
      if (buffer.length >= rowWidth) {
        waves.push([...buffer]);
        buffer = [];
      }
    }
  });
  if (buffer.length > 0) {
    waves.push(buffer);
  }
  return { waves, total };
}

interface Props {
  /** Seconds between 2 emojis */
  staggerSec?: number;
  /** Duration of wave from top to bottom */
  durationSec?: number;
  /** Called when the last wave starts */
  onLastWave?: () => void;
  /** Called when the last wave finishes */
  onFinish?: () => void;
}

const ROW_WIDTH = 3;

export function EmojiWave({
  staggerSec,
  durationSec,
  onLastWave,
  onFinish,
}: Props) {
  // Define emoji waves - each array is one wave
  const { waves, total } = buildWaves(
    ROW_WIDTH,
    ['😮', 6],
    ['😱', 6],
    ['🦌', 19],
    [<IconCatWithEyes className="cat-icon" />, 7],
    ['👑', 6],
    // ...playerAvatars.map((a) => [<img className="avatar inline-avatar" src={a.url}/>, 1]),
    // [<img className="avatar inline-avatar" src={botAvatars[0].url}/>, 1],
  );

  if (staggerSec === undefined) staggerSec = 0.05;
  if (durationSec === undefined) durationSec = 1;
  
  // Estimating when the last wave completes:
  const waveStaggerSec = staggerSec * ROW_WIDTH;
  const lastWaveStartSec = waves.length * waveStaggerSec;
  useEffect(() => {
    const timeout = setTimeout(() => {
      onLastWave && onLastWave();
    }, lastWaveStartSec * 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);
  const lastWaveStarted = useDelay(true, 2500);

  // Container variants using staggerChildren to manage sequential delays
  const waveContainerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        // Delay between each wave (not between emojis within a wave)
        staggerChildren: waveStaggerSec, // seconds between waves
        // When all waves complete, trigger content
        when: 'beforeChildren',
      },
    },
  };

  // Individual wave variants
  const waveVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        // Delay between emojis within the same wave
        staggerChildren: staggerSec, // seconds between emojis in a wave
      },
    },
  };

  // Individual emoji animation
  const emojiVariants: Variants = {
    hidden: {
      y: '-110%',
    },
    visible: {
      y: '120vh', // Roll past the screen
      transition: {
        duration: durationSec,
        ease: 'linear',
      },
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="emoji-waves-container"
        variants={waveContainerVariants}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0 }}
        onAnimationComplete={() => {
          // Delay slightly before calling
          // setTimeout(() => onFinish(), 300);
          onFinish && onFinish();
        }}
      >
        {waves.map((wave, waveIndex) => (
          <motion.div
            key={waveIndex}
            className="emoji-wave"
            variants={waveVariants}
          >
            {wave.map((emoji, emojiIndex) => (
              <motion.div
                key={`${waveIndex}-${emojiIndex}`}
                className="rolling-emoji"
                variants={emojiVariants}
              >
                {/* Expecting either emojies or icons */}
                {typeof emoji == 'string' ? <Twemoji>{emoji}</Twemoji> : emoji}
              </motion.div>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
