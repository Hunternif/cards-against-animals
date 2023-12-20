import { PlayerResponse, ResponseCardInGame } from "../shared/types";
import { ResponseCard } from "./Cards";

interface HandProps {
  pick: number,
  hand: ResponseCardInGame[],
  response?: PlayerResponse,
  selectedCards: ResponseCardInGame[],
  setSelectedCards: (cards: ResponseCardInGame[]) => void,
}

/** Displays cards that the player has on hand */
export function GameHand(
  { pick, hand, response, selectedCards, setSelectedCards }: HandProps
) {
  const selectable = !response && pick > 0;

  function getSelectedIndex(card: ResponseCardInGame): number {
    // check card by ID, because the response instance could be unequal:
    if (response) {
      return response.cards.findIndex((c) => c.card_id === card.card_id);
    } else {
      return selectedCards.indexOf(card);
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

  function deselectCard(cardID: ResponseCardInGame) {
    const newSelection = selectedCards.slice();
    const index = newSelection.indexOf(cardID);
    if (index > -1) {
      newSelection.splice(index, 1);
      setSelectedCards(newSelection);
    }
  }
  return hand.map((card) =>
    <ResponseCard key={card.id} card={card}
      selectable={selectable}
      selectedIndex={getSelectedIndex(card)}
      showIndex={pick > 1}
      onToggle={(selected) => {
        if (selectable) {
          if (selected) selectCard(card);
          else deselectCard(card);
        }
      }} />
  );
}