import {
  combinedCardList,
  copyDeck,
  copyDeckCard,
  filterPromptDeckCard,
  filterResponseDeckCard,
} from '../shared/deck-utils';
import { Deck, DeckCard, DeckTag } from '../shared/types';
import { cardOrdinalToID } from './deck-parser';

/**
 * Appends new cards and tags to destination deck.
 * Returns a modified copy of destination deck.
 * IDs of source deck will be changed to prevent collisions.
 */
export async function mergeDecks(dest: Deck, source: Deck): Promise<Deck> {
  const updatedCards = updateCardsForMerge(dest, combinedCardList(source));
  const sourcePrompts = updatedCards.filter(filterPromptDeckCard);
  const sourceResponses = updatedCards.filter(filterResponseDeckCard);
  const destCopy = copyDeck(dest);
  destCopy.prompts.push(...sourcePrompts);
  destCopy.responses.push(...sourceResponses);
  // Merge tags:
  const tagMap = new Map<string, DeckTag>(
    destCopy.tags.map((tag) => [tag.name, tag]),
  );
  source.tags.forEach((newTag) => {
    tagMap.set(newTag.name, newTag);
  });
  destCopy.tags = Array.from(tagMap.values());
  return destCopy;
}

/**
 * Returns copies of the given cards, with updated IDs to prevent
 * collisions with the source deck.
 */
export function updateCardsForMerge(dest: Deck, cards: DeckCard[]): DeckCard[] {
  // Assuming card ID format to be '0001'.
  const idRegex = /^\d{4}$/;
  let topID = -1;
  const usedIDs = new Set<string>();
  function processExistingID(idStr: string) {
    usedIDs.add(idStr);
    if (idRegex.test(idStr)) {
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        topID = Math.max(topID, id);
      }
    }
  }
  function updateCardID<T extends DeckCard>(card: T): T {
    if (topID > -1 && idRegex.test(card.id)) {
      const iCardID = parseInt(card.id);
      if (!isNaN(iCardID)) {
        const newCard = copyDeckCard(card);
        let newID = cardOrdinalToID(topID + iCardID);
        if (usedIDs.has(newID)) {
          throw Error(`Couldn't merge. Duplicate ID ${newID}`);
        }
        usedIDs.add(newID);
        newCard.id = newID;
        return newCard;
      }
    }
    return card;
  }
  dest.prompts.forEach((card) => processExistingID(card.id));
  dest.responses.forEach((card) => processExistingID(card.id));
  return cards.map((card) => updateCardID(card));
}
