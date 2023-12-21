import { useContext } from "react";
import { GameLobby, GameTurn, PlayerResponse, ResponseCardInGame } from "../shared/types";
import { ResponseCard } from "./Cards";
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
}

/** Displays cards that the player has on hand */
export function GameHand(
  { lobby, turn, user, pick, hand, response,
    selectedCards, setSelectedCards
  }: HandProps
) {
  const selectable = !response && pick > 0;
  const { setError } = useContext(ErrorContext);

  function getSelectedIndex(card: ResponseCardInGame): number {
    // check card by ID, because the response instance could be unequal:
    if (response) {
      return response.cards.findIndex((c) => c.id === card.id);
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

  async function handleDownvote(card: ResponseCardInGame, downvoted: boolean) {
    await toggleDownvoteCard(lobby, turn, user.uid, card, downvoted)
      .catch((e) => setError(e));
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
      }}
      onToggleDownvote={(downvoted) => handleDownvote(card, downvoted)}
    />
  );
}