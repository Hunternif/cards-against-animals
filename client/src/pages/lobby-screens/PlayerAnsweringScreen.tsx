import { CSSProperties, useContext, useEffect, useState } from 'react';
import { ErrorContext } from '../../components/ErrorContext';
import { CenteredLayout } from '../../components/layout/CenteredLayout';
import { ScreenSizeSwitch } from '../../components/layout/ScreenSizeSwitch';
import {
  cancelPlayerResponse,
  submitPlayerResponse,
} from '../../api/turn/turn-response-api';
import { ResponseCardInGame } from '../../shared/types';
import { CardPromptWithCzar } from './game-components/CardPrompt';
import { useGameContext } from './game-components/GameContext';
import { GameControlRow } from './game-components/GameControlRow';
import { GameHand } from './game-components/GameHand';
import { GameMiniResponses } from './game-components/GameMiniResponses';
import { ResponseCount } from './game-components/ResponseCount';
import { useSoundOnResponse } from '../../components/sounds';
import {
  discardCards,
  discardImmediately,
} from '../../api/turn/turn-discard-api';

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
};
const rowStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  flexBasis: 1,
  flexWrap: 'wrap',
  gap: '1em',
};
const topRowStyle: CSSProperties = {
  justifyContent: 'flex-start',
  flexWrap: 'nowrap',
  paddingLeft: '1em',
  paddingRight: '1em',
};
const midRowStyle: CSSProperties = {
  justifyContent: 'center',
  height: 'auto',
};
const botRowStyle: CSSProperties = {
  justifyContent: 'center',
  paddingTop: '0.5rem',
  paddingBottom: '1rem',
  paddingLeft: '1em',
  paddingRight: '1em',
};
const miniResponsesContainerStyle: CSSProperties = {
  flex: '1 1 auto',
  overflow: 'hidden',
  maxHeight: '20rem',
  marginTop: '1em',
};

export function PlayerAnsweringScreen() {
  const { lobby, turn, player, prompt, responses, hand } = useGameContext();
  const response = responses.find((r) => r.player_uid === player.uid);
  const submitted = response !== undefined;
  const [selectedCards, setSelectedCards] = useState<ResponseCardInGame[]>(
    response?.cards?.slice() ?? [],
  );
  const [discardedCards, setDiscardedCards] = useState<ResponseCardInGame[]>(
    [],
  );
  const [discarding, setDiscarding] = useState(false);
  const { setError } = useContext(ErrorContext);

  // Synchronize selected cards with response on the server:
  useEffect(() => {
    if (response) setSelectedCards(response.cards);
  }, [response]);

  // Whenever a new response is added, play a sound:
  useSoundOnResponse();

  /** When cards are clicked for response. */
  async function handleSelect(cards: ResponseCardInGame[]) {
    setSelectedCards(cards);
    if (cards.length === prompt?.pick) {
      await submitPlayerResponse(lobby, turn, player, cards).catch((e: any) =>
        setError(e),
      );
    } else {
      await cancelPlayerResponse(lobby, turn, player).catch((e: any) =>
        setError(e),
      );
    }
  }

  async function handleSubmitDiscard() {
    if (discardedCards.length > 0) {
      try {
        // TODO: combine discard and discardImmediately
        await discardCards(lobby, turn, player.uid, discardedCards);
        await discardImmediately(lobby);
      } catch (e: any) {
        setError(e);
      } finally {
        setDiscarding(false);
        setDiscardedCards([]);
      }
    }
  }
  function selectDiscardAll() {
    const allDiscardable = hand.filter(
      (c1) => !selectedCards.find((c2) => c1.id === c2.id),
    );
    setDiscardedCards(allDiscardable);
  }
  function handleCancelDiscard() {
    setDiscardedCards([]);
    setDiscarding(false);
  }

  // Cancel discard if lobby settings change:
  useEffect(() => {
    if (lobby.settings.discard_cost === 'no_discard') {
      setDiscardedCards([]);
      setDiscarding(false);
    }
  }, [lobby.settings.discard_cost]);

  // Clear selection if it's a new turn:
  if (turn.phase !== 'answering' && selectedCards.length > 0) {
    setSelectedCards([]);
  }

  return (
    <CenteredLayout
      innerStyle={containerStyle}
      outerClassName="player-answering-screen"
      innerClassName="player-answering-container"
    >
      <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
        <CardPromptWithCzar card={prompt} canVote />
        {prompt && (
          <ScreenSizeSwitch
            widthBreakpoint={480}
            smallScreen={<ResponseCount />}
            bigScreen={
              <div style={miniResponsesContainerStyle}>
                <GameMiniResponses />
              </div>
            }
          />
        )}
      </div>
      <div className="game-mid-row" style={{ ...rowStyle, ...midRowStyle }}>
        <GameControlRow
          selection={selectedCards}
          submitted={submitted}
          discarding={discarding}
          discardedCards={discardedCards}
          onBeginDiscard={() => setDiscarding(true)}
          onSubmitDiscard={() => handleSubmitDiscard()}
          onCancelDiscard={() => handleCancelDiscard()}
          onSetDiscardAll={() => selectDiscardAll()}
        />
      </div>
      <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
        <GameHand
          selectedCards={selectedCards}
          setSelectedCards={handleSelect}
          discarding={discarding}
          discardedCards={discardedCards}
          setDiscardedCards={setDiscardedCards}
        />
      </div>
    </CenteredLayout>
  );
}
