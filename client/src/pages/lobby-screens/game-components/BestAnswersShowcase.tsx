import { useEffect, useState } from 'react';
import {
  getBestAnswers,
  ResponseWithPrompt,
} from '../../../api/lobby/lobby-stats-api';
import { useScreenSize } from '../../../components/layout/ScreenSizeSwitch';
import { useAsyncData } from '../../../hooks/data-hooks';
import { RNG } from '../../../shared/rng';
import { GameLobby } from '../../../shared/types';
import { CardStack } from './CardStack';

interface Props {
  lobby: GameLobby;
}

/**
 * Rains down best answers from the current lobby.
 */
export function BestAnswersShowcase({ lobby }: Props) {
  const [visibleAnswers, setVisibleAnswers] = useState<
    Array<ResponseWithPrompt>
  >([]);

  const [bestAnswers] = useAsyncData(getBestAnswers(lobby.id));
  const screenSize = useScreenSize();
  // TODO: use actual card size
  const cardSize = { width: '10rem', height: '14rem' };
  const padding = { x: '2rem', y: '2rem' };

  // Predictable RNG seed:
  const firstCard = bestAnswers?.at(0)?.response?.cards?.at(0);
  const rng = RNG.fromStrSeed(firstCard?.content ?? 'initial');

  useEffect(() => {
    let interval: any;
    if (bestAnswers && bestAnswers.length > 0) {
      // add the first card:
      let currentlyVisible = [bestAnswers[0]];
      setVisibleAnswers(currentlyVisible);
      // Add more cards in a loop:
      let i = 1;
      interval = setInterval(() => {
        if (i >= bestAnswers.length) {
          // loop forever:
          i = 0;
        }
        currentlyVisible = [...currentlyVisible, bestAnswers[i]];
        setVisibleAnswers(currentlyVisible);
        i++;
      }, 3000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [bestAnswers]);

  return (
    <>
      {visibleAnswers.map((answer, i) => {
        return (
          <div
            key={`${answer.prompt.id}${answer.response.cards[0].id}_${i}`}
            className="answer-showcase"
            style={{
              opacity: 0.5,
              // TODO: space them evenly
              left: `calc(${padding.x} + (${screenSize.width}px - 10rem - 2*${
                padding.x
              }) * ${rng.randomFloat()})`,
            }}
          >
            <CardStack
              showLikes
              cards={[answer.prompt, ...answer.response.cards]}
              likeCount={answer.response.like_count}
            />
          </div>
        );
      })}
    </>
  );
}
