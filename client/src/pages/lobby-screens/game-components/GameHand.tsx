import { useContext } from 'react';
import { ErrorContext } from '../../../components/ErrorContext';
import { toggleDownvoteCard } from '../../../api/turn/turn-vote-card-api';
import { ResponseCardInGame, ResponseCardInHand } from '../../../shared/types';
import { CardResponse } from './CardResponse';
import { useGameContext } from './GameContext';

interface HandProps {
  selectedCards: ResponseCardInGame[];
  setSelectedCards: (cards: ResponseCardInGame[]) => void;
  discarding: boolean;
  discardedCards: ResponseCardInGame[];
  setDiscardedCards: (cards: ResponseCardInGame[]) => void;
}

/** Displays cards that the player has on hand */
export function GameHand({
  selectedCards,
  setSelectedCards,
  discarding,
  discardedCards,
  setDiscardedCards,
}: HandProps) {
  const { lobby, playerState, hand, prompt } = useGameContext();
  const handSorted = hand.sort(
    (c1, c2) =>
      c1.random_index +
      c1.time_received.getTime() -
      (c2.random_index + c2.time_received.getTime()),
  );
  const pick = prompt?.pick ?? 0;
  const isHandSelectable = pick > 0;
  const { setError } = useContext(ErrorContext);

  function getIsNew(card: ResponseCardInHand): boolean {
    return card.time_received >= playerState.time_dealt_cards;
  }

  function getSelectedIndex(card: ResponseCardInHand): number {
    return selectedCards.findIndex((c) => c.id === card.id);
  }

  function selectCard(card: ResponseCardInHand) {
    const newSelection = selectedCards.slice();
    // Don't select more than required:
    if (newSelection.length >= pick) {
      newSelection.pop();
    }
    newSelection.push(card);
    setSelectedCards(newSelection);
  }

  function deselectCard(card: ResponseCardInHand) {
    const newSelection = selectedCards.slice();
    const index = newSelection.findIndex((c) => c.id === card.id);
    if (index > -1) {
      newSelection.splice(index, 1);
      setSelectedCards(newSelection);
    }
  }

  async function handleDownvote(card: ResponseCardInHand, downvoted: boolean) {
    try {
      await toggleDownvoteCard(lobby, playerState, card, downvoted);
    } catch (e: any) {
      setError(e);
    }
  }

  function getIsDiscarded(card: ResponseCardInHand): boolean {
    // check card by ID, because the response instance could be unequal:
    return discardedCards.findIndex((c) => c.id === card.id) > -1;
  }

  function discardCard(card: ResponseCardInHand) {
    const newDiscarded = discardedCards.slice();
    newDiscarded.push(card);
    setDiscardedCards(newDiscarded);
  }

  function undiscardCard(card: ResponseCardInHand) {
    const newDiscarded = discardedCards.slice();
    const index = newDiscarded.findIndex((c) => c.id === card.id);
    if (index > -1) {
      newDiscarded.splice(index, 1);
      setDiscardedCards(newDiscarded);
    }
  }

  return handSorted.map((card) => {
    const selectedIndex = getSelectedIndex(card);
    const isSelected = selectedIndex >= 0;
    const isDiscarded = getIsDiscarded(card);
    const isNew = getIsNew(card);
    let isSelectable: boolean;
    if (discarding) {
      isSelectable = !isSelected;
    } else {
      isSelectable = isHandSelectable;
      if (card.action === 'repeat_last' && selectedCards.length == 0) {
        isSelectable = false;
      }
    }
    return (
      <CardResponse
        key={card.id}
        card={card}
        justIn={isNew}
        downvotable
        downvoted={playerState.downvoted.has(card.id)}
        selectable={isSelectable}
        selectedIndex={getSelectedIndex(card)}
        showIndex={pick > 1}
        onToggle={(selected) => {
          if (isHandSelectable) {
            if (selected) {
              selectCard(card);
              if (isDiscarded) {
                undiscardCard(card);
              }
            } else deselectCard(card);
          }
        }}
        onToggleDownvote={(downvoted) => handleDownvote(card, downvoted)}
        discarding={!isSelected && discarding}
        discarded={isDiscarded}
        onToggleDiscard={(discarded) => {
          if (discarded) discardCard(card);
          else undiscardCard(card);
        }}
      />
    );
  });
}
