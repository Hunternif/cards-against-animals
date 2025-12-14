import { StatsContainer, UserStats } from '@shared/types';
import { User } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { IconChevronDown, IconChevronUp } from '../../components/Icons';
import { EmojiWave } from './EmojiWave';
import {
  AllTimeGamesSlide,
  AllTimeTeammatesSlide,
  AllTimeWinsSlide,
  IntroSlide,
  OutroSlide,
  TopCardsSlide,
  TopResponsesSlide,
  Year2024Slide,
  Year2025Slide,
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

  // Define all slides
  const slides = [
    { id: 'intro', component: IntroSlide },
    { id: 'all-time-games', component: AllTimeGamesSlide },
    { id: 'all-time-wins', component: AllTimeWinsSlide },
    { id: 'all-time-teammates', component: AllTimeTeammatesSlide },
    { id: 'top-cards', component: TopCardsSlide },
    { id: 'top-responses', component: TopResponsesSlide },
    { id: 'year-2025', component: Year2025Slide },
    { id: 'year-2024', component: Year2024Slide },
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

  return (
    <div
      className="rewind-container"
      onKeyDown={handleKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      <EmojiWave onLastWave={() => setEmojiWaveComplete(true)} />

      {emojiWaveComplete && (
        <>
          <motion.div
            className="rewind-vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <AnimatePresence initial={true} custom={direction} mode="wait">
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
