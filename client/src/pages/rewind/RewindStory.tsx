import { StatsContainer, UserStats } from '@shared/types';
import { User } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { CSSProperties, useCallback, useState } from 'react';
import { soundDrumRollLong, soundMusicNge } from '../../api/sound-api';
import { InlineButton } from '../../components/Buttons';
import { useDelay } from '../../components/Delay';
import {
  IconCatWithEyes,
  IconChevronDown,
  IconChevronUp,
} from '../../components/Icons';
import { Twemoji } from '../../components/Twemoji';
import { useSound } from '../../hooks/sound-hooks';
import { EmojiWave } from './EmojiWave';
import {
  GlobalIntroSlide,
  GlobalLeaderboardSlide,
  GlobalTopLikedResponsesSlide,
  GlobalTopPromptsSlide,
  GlobalTopResponseCardsSlide,
  IntroSlide,
  OutroSlide,
  Year2024Slide,
  Year2025Slide,
  YourGamesSlide,
  YourTeammatesSlide,
  YourTopCardsSlide,
  YourTopResponsesSlide,
  YourWinsSlide,
} from './slides';

interface RewindStoryProps {
  user: User;
  userStats: {
    allTime: UserStats;
    year2025: UserStats | null;
    year2024: UserStats | null;
  };
  statsContainer: StatsContainer;
}

export function RewindStory({
  user,
  userStats,
  statsContainer,
}: RewindStoryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [emojiWaveComplete, setEmojiWaveComplete] = useState(false);
  const [enableMusic, setEnableMusic] = useState(true);

  // Define all slides
  const slides = [
    { id: 'intro', component: IntroSlide },
    { id: 'your-games', component: YourGamesSlide },
    { id: 'your-wins', component: YourWinsSlide },
    { id: 'your-teammates', component: YourTeammatesSlide },
    { id: 'your-top-cards', component: YourTopCardsSlide },
    { id: 'your-top-responses', component: YourTopResponsesSlide },
    { id: 'year-2025', component: Year2025Slide },
    { id: 'year-2024', component: Year2024Slide },
    { id: 'global-intro', component: GlobalIntroSlide },
    { id: 'global-top-prompts', component: GlobalTopPromptsSlide },
    { id: 'global-top-response-cards', component: GlobalTopResponseCardsSlide },
    {
      id: 'global-top-liked-responses',
      component: GlobalTopLikedResponsesSlide,
    },
    { id: 'global-leaderboard', component: GlobalLeaderboardSlide },
    { id: 'outro', component: OutroSlide },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      handleNext();
    } else if (e.key === 'ArrowUp') {
      handlePrev();
    }
  };

  // Swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe) {
      handleNext();
    } else if (isDownSwipe) {
      handlePrev();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      y: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  const CurrentSlideComponent = slides[currentSlide].component;

  useSound(soundDrumRollLong, {
    volume: 0.5,
    enabled: enableMusic,
  });
  const startMusic = useDelay(true, 2000);
  const { soundError, retrySound } = useSound(soundMusicNge, {
    volume: 0.2,
    enabled: enableMusic && (startMusic ?? false),
  });

  const toggleMusic = useCallback(() => {
    let enabled = enableMusic;
    if (soundError) {
      // If there was an error, sound is displayed as muted. So we try to enable it:
      enabled = true;
    } else {
      enabled = !enabled;
    }
    // Allow people to restart music by clicking the button again:
    if (enabled) {
      retrySound();
    }
    setEnableMusic(enabled);
  }, [soundError, retrySound]);

  return (
    <div
      className="rewind-container"
      onKeyDown={handleKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      <InlineButton big onClick={toggleMusic} style={muteButton}>
        <Twemoji>{enableMusic ? '🔊' : '🔇'}</Twemoji>
      </InlineButton>

      <EmojiWave
        rows={3}
        emojis={[
          ['😮', 6],
          ['😱', 6],
          ['🦌', 19],
          [<IconCatWithEyes />, 7],
          ['👑', 6],
          // ...playerAvatars.map((a) => [<img className="avatar inline-avatar" src={a.url}/>, 1]),
          // [<img className="avatar inline-avatar" src={botAvatars[0].url}/>, 1],
        ]}
        onLastWave={() => setEmojiWaveComplete(true)}
      />

      {emojiWaveComplete && (
        <>
          <motion.div
            className="rewind-vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <AnimatePresence initial={true} custom={direction} mode="popLayout">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                y: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="rewind-slide"
            >
              <CurrentSlideComponent
                user={user}
                userStats={userStats}
                statsContainer={statsContainer}
                onNext={handleNext}
                onPrev={handlePrev}
                isFirst={currentSlide === 0}
                isLast={currentSlide === slides.length - 1}
              />
            </motion.div>
          </AnimatePresence>

          {/* Progress indicator */}
          <div className="rewind-progress">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${
                  index === currentSlide ? 'active' : ''
                } ${index < currentSlide ? 'completed' : ''}`}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1);
                  setCurrentSlide(index);
                }}
              />
            ))}
          </div>

          {/* Navigation hints */}
          {currentSlide > 0 && (
            <button className="rewind-nav rewind-nav-up" onClick={handlePrev}>
              <IconChevronUp className="arrow" />
            </button>
          )}
          {currentSlide < slides.length - 1 && (
            <button className="rewind-nav rewind-nav-down" onClick={handleNext}>
              <IconChevronDown className="arrow" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

const muteButton: CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 100,
};
