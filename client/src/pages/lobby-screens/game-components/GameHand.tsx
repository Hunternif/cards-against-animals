import { useContext, useState } from "react";
import { ErrorContext } from "../../../components/ErrorContext";
import { toggleDownvoteCard } from "../../../model/turn-api";
import { PlayerResponse, ResponseCardInGame } from "../../../shared/types";
import { CardResponse } from "./CardResponse";
import { useGameContext } from "./GameContext";

interface HandProps {
  response?: PlayerResponse,
  selectedCards: ResponseCardInGame[],
  setSelectedCards: (cards: ResponseCardInGame[]) => void,
  discarding: boolean,
  discardedCards: ResponseCardInGame[],
  setDiscardedCards: (cards: ResponseCardInGame[]) => void,
}

/** Displays cards that the player has on hand */
export function GameHand({
  response,
  selectedCards, setSelectedCards,
  discarding, discardedCards, setDiscardedCards,
}: HandProps) {
  const { lobby, turn, player, hand, prompt } = useGameContext();
  // TODO: sort by the time cards arrive in hand.
  const handSorted = hand.sort((c1, c2) => c1.random_index - c2.random_index);
  // Remember hand from the previous turn:
  const [prevHand, setPrevHand] = useState<ResponseCardInGame[]>([]);
  // New cards will be animated:
  const [newCards, setNewCards] = useState<ResponseCardInGame[]>([]);
  const pick = prompt?.pick ?? 0;
  const isHandSelectable = pick > 0;
  const { setError } = useContext(ErrorContext);

  // Mark new cards:
  if (handSorted && prevHand != handSorted) {
    setNewCards(hand.filter((c) => prevHand.findIndex((c2) => c.id === c2.id) === -1));
    setPrevHand(handSorted);
  }
  function getIsNew(card: ResponseCardInGame): boolean {
    return newCards.findIndex((c2) => card.id === c2.id) > -1;
  }

  function getSelectedIndex(card: ResponseCardInGame): number {
    // check card by ID, because the response instance could be unequal:
    if (response) {
      return response.cards.findIndex((c) => c.id === card.id);
    } else {
      return selectedCards.findIndex((c) => c.id === card.id);
    }
  }

  function selectCard(card: ResponseCardInGame) {
    const newSelection = selectedCards.slice();
    // Don't select more than required:
    if (newSelection.length >= pick) {
      newSelection.pop();
    }
    newSelection.push(card);
    setSelectedCards(newSelection);
  }

  function deselectCard(card: ResponseCardInGame) {
    const newSelection = selectedCards.slice();
    const index = newSelection.findIndex((c) => c.id === card.id);
    if (index > -1) {
      newSelection.splice(index, 1);
      setSelectedCards(newSelection);
    }
  }

  async function handleDownvote(card: ResponseCardInGame, downvoted: boolean) {
    await toggleDownvoteCard(lobby, turn, player.uid, card, downvoted)
      .catch((e) => setError(e));
  }

  function getIsDiscarded(card: ResponseCardInGame): boolean {
    // check card by ID, because the response instance could be unequal:
    return discardedCards.findIndex((c) => c.id === card.id) > -1;
  }

  function discardCard(card: ResponseCardInGame) {
    const newDiscarded = discardedCards.slice();
    newDiscarded.push(card);
    setDiscardedCards(newDiscarded);
  }

  function undiscardCard(card: ResponseCardInGame) {
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
    return <CardResponse key={card.id} card={card} justIn={isNew}
      selectable={(discarding || isHandSelectable) && !(discarding && isSelected)}
      selectedIndex={getSelectedIndex(card)}
      showIndex={pick > 1}
      onToggle={(selected) => {
        if (isHandSelectable) {
          if (selected) {
            selectCard(card);
            if (isDiscarded) {
              undiscardCard(card);
            }
          }
          else deselectCard(card);
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
  }
  );
}