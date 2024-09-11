import { useContext, useEffect, useState } from 'react';
import { GameButton } from '../../components/Buttons';
import { ErrorContext } from '../../components/ErrorContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { GameLayout } from '../../components/layout/GameLayout';
import { endLobby } from '../../api/lobby/lobby-control-api';
import { PromptCardInGame } from '../../shared/types';
import { CardPrompt } from './game-components/CardPrompt';
import { useGameContext } from './game-components/GameContext';
import { HaikuSizeSelector } from './lobby-components/HaikuSizeSelector';
import { haikuPrompt3 } from '../../api/deck/deck-repository';
import { logInteraction } from '../../api/log-api';
import pop_3 from '../../assets/sounds/pop_3.mp3';
import {
  discardPrompts,
  getPromptCount,
  pickNewPrompts,
  playPrompt,
} from '../../api/turn/turn-prompt-api';

export function JudgePickPromptScreen() {
  const { lobby, turn, isJudge } = useGameContext();
  const [prompts, setPrompts] = useState<PromptCardInGame[]>([]);
  const [haikuPrompt, setHaikuPrompt] = useState(haikuPrompt3);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptCardInGame | null>(
    null,
  );
  const [cardCount, setCardCount] = useState(-1);
  const [notified, setNotified] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);
  const isHaiku = prompts.length === 1 && prompts[0].id === haikuPrompt.id;

  async function getInitialPrompts() {
    await pickNewPrompts(lobby)
      .then((cards) => {
        setPrompts(cards);
        setInitialLoaded(true);
      })
      .catch((e: any) => setError(e));
  }

  async function handleChange() {
    if (isHaiku) {
      await getInitialPrompts();
    } else if (prompts.length > 0) {
      // This is only called once per card, so we can safely log the impression
      // of the previous card, because we will never see it again:
      logInteraction(lobby.id, { viewed: prompts, discarded: prompts });
      await discardPrompts(lobby, prompts)
        .then(() => pickNewPrompts(lobby))
        .then((cards) => setPrompts(cards))
        .catch((e: any) => setError(e));
    }
  }

  function handleNewHaiku(haiku: PromptCardInGame) {
    setPrompts([haiku]);
    setHaikuPrompt(haiku);
    setSelectedPrompt(haiku);
  }

  async function handlePlayHaiku() {
    if (!isHaiku) {
      setPrompts([haikuPrompt]);
      setSelectedPrompt(haikuPrompt);
    } else {
      setSelectedPrompt(null);
      await getInitialPrompts();
    }
  }

  async function handleSubmit() {
    if (selectedPrompt) {
      // "Played" interaction will be logged on the server.
      setSubmitted(true);
      await playPrompt(lobby, turn, selectedPrompt).catch((e: any) => {
        setError(e);
        setSubmitted(false);
      });
    }
  }

  async function handleEndGame() {
    setEnding(true);
    await endLobby(lobby).catch((e: any) => {
      setError(e);
      setEnding(false);
    });
  }

  // Load the initial prompt when the screen loads:
  useEffect(() => {
    if (!initialLoaded && prompts.length === 0) {
      getInitialPrompts().catch((e: any) => setError(e));
    }
  }, [lobby, prompts.length, initialLoaded, getInitialPrompts, setError]);

  useEffect(() => {
    getPromptCount(lobby).then((c) => setCardCount(c));
  }, [lobby, prompts]);

  useEffect(() => {
    if (!notified && isJudge) {
      new Audio(pop_3).play();
      setNotified(true);
    }
  }, [notified]);

  return (
    <GameLayout className="pick-prompt-screen">
      <header>
        <h2 className="dim">
          You are <i>Card Czar</i>! Pick a card:
        </h2>
      </header>
      <section>
        {!initialLoaded ? (
          <LoadingSpinner delay text="Loading deck..." />
        ) : (
          <>
            {prompts.length > 0 ? (
              <>
                <div className="column-left" />
                <div className="column-center prompts-container">
                  {prompts.map((card) => (
                    <CardPrompt
                      key={card.id}
                      card={card}
                      canSelect={prompts.length > 1}
                      selected={
                        prompts.length > 1 && selectedPrompt?.id === card.id
                      }
                      onClick={() => setSelectedPrompt(card)}
                    />
                  ))}
                </div>
                <div className="column-right controls">
                  {cardCount > 1 ? (
                    <>
                      {isHaiku && (
                        <HaikuSizeSelector onNewHaiku={handleNewHaiku} />
                      )}
                      <GameButton
                        secondary
                        small
                        onClick={handlePlayHaiku}
                        className="haiku-button"
                        title="Play a haiku prompt with 3 phrases."
                      >
                        {!isHaiku ? 'Play Haiku' : 'Cancel haiku'}
                      </GameButton>
                      <GameButton
                        secondary
                        small
                        onClick={handleChange}
                        title="Discard these prompts and get a new set."
                      >
                        Change cards...
                      </GameButton>
                      <span className="extra-dim card-counter">
                        {cardCount} cards left
                      </span>
                    </>
                  ) : (
                    <span
                      className="extra-dim"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Last card
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                {cardCount > 0
                  ? `Oops! ${cardCount} cards remaining, but couldn't load any`
                  : cardCount == 0
                  ? 'No more cards left :('
                  : ''}
              </>
            )}
          </>
        )}
      </section>
      <footer>
        {prompts.length > 0 ? (
          <GameButton
            accent
            onClick={handleSubmit}
            className="play-button"
            disabled={!selectedPrompt || submitted || ending}
          >
            Play
          </GameButton>
        ) : (
          <>
            {cardCount == 0 && (
              <GameButton onClick={handleEndGame} disabled={ending}>
                End game
              </GameButton>
            )}
          </>
        )}
      </footer>
    </GameLayout>
  );
}
