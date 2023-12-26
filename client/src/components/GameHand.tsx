import { useContext } from "react";
import { GameLobby, GameTurn, PlayerResponse, ResponseCardInGame } from "../shared/types";
import { CardResponse } from "./CardResponse";
import { ErrorContext } from "./ErrorContext";
import { toggleDownvoteCard } from "../model/turn-api";
import { User } from "firebase/auth";

interface HandProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  pick: number,
  hand: ResponseCardInGame[],
  response?: PlayerResponse,
  selectedCards: ResponseCardInGame[],
  setSelectedCards: (cards: ResponseCardInGame[]) => void,
  discarding: boolean,
  discardedCards: ResponseCardInGame[],
  setDiscardedCards: (cards: ResponseCardInGame[]) => void,
}

/** Displays cards that the player has on hand */
export function GameHand(
  { lobby, turn, user, pick, hand, response,
    selectedCards, setSelectedCards,
    discarding, discardedCards, setDiscardedCards,
  }: HandProps
) {
  const selectable = pick > 0;
  const { setError } = useContext(ErrorContext);

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
    await toggleDownvoteCard(lobby, turn, user.uid, card, downvoted)
      .catch((e) => setError(e));
  }

  function isDiscarded(card: ResponseCardInGame): boolean {
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

  return hand.map((card) =>
    <CardResponse key={card.id} card={card}
      selectable={selectable}
      selectedIndex={getSelectedIndex(card)}
      showIndex={pick > 1}
      onToggle={(selected) => {
        if (selectable) {
          if (selected) {
            selectCard(card);
            undiscardCard(card);
          }
          else deselectCard(card);
        }
      }}
      onToggleDownvote={(downvoted) => handleDownvote(card, downvoted)}
      discarding={discarding}
      discarded={isDiscarded(card)}
      onToggleDiscard={(discarded) => {
        if (discarded) {
          discardCard(card);
          deselectCard(card);
        }
        else undiscardCard(card);
      }}
    />
  );
}