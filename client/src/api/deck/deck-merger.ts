import {
  combinedCardList,
  copyDeck,
  copyDeckCard,
} from '../../shared/deck-utils';
import { Deck, DeckCard, DeckTag } from '../../shared/types';
import { DeckCardSet } from './deck-card-set';
import { cardOrdinalToID } from './deck-parser';

/**
 * Appends new cards and tags to destination deck.
 * Returns a modified copy of destination deck.
 * IDs of source deck will be changed to prevent collisions.
 */
export async function mergeDecks(dest: Deck, source: Deck): Promise<Deck> {
  const updatedCards = updateCardsForMerge(dest, DeckCardSet.fromDeck(source));
  const destCopy = copyDeck(dest);
  destCopy.prompts.push(...updatedCards.prompts);
  destCopy.responses.push(...updatedCards.responses);
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
export function updateCardsForMerge(
  dest: Deck,
  cardset: DeckCardSet,
): DeckCardSet {
  // TODO: maybe refactor cards so that prompts and resposnes have unique IDs?
  const normalizedSet = normalizeCardset(cardset);
  return new DeckCardSet(
    normalizeCardIDs(combinedCardList(dest), normalizedSet.cards),
  );
}

/**
 * Returns copies of `sourceCards`, with updated IDs to prevent
 * collisions with `destCards`.
 */
function normalizeCardIDs<T extends DeckCard>(
  destCards: DeckCard[],
  sourceCards: T[],
): T[] {
  // Assuming card ID format to be '0001'.
  const idRegex = /^\d{4}$/;
  let topID = destCards.length;
  let collisionCount = 0;
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
  function updateCardID(card: T): T {
    if (usedIDs.has(card.id)) {
      collisionCount++;
      const newCard = copyDeckCard(card);
      let newID = cardOrdinalToID(topID + collisionCount);
      if (usedIDs.has(newID)) {
        throw Error(`Couldn't merge. Duplicate ID ${newID}`);
      }
      usedIDs.add(newID);
      newCard.id = newID;
      return newCard;
    }
    return card;
  }
  destCards.forEach((card) => processExistingID(card.id));
  return sourceCards.map((card) => updateCardID(card));
}

/**
 * Returns copies of the given cards, with updated IDs to prevent collisions
 * between prompts and responses. Prompt IDs go before response IDs.
 */
export function normalizeCardset(cardset: DeckCardSet): DeckCardSet {
  const updatedResponses = normalizeCardIDs(cardset.prompts, cardset.responses);
  return DeckCardSet.fromList(cardset.prompts, updatedResponses);
}
