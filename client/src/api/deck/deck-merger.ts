import {
  combinedCardList,
  copyDeck,
  copyDeckCard,
} from '../../shared/deck-utils';
import { Deck, DeckCard, DeckTag } from '../../shared/types';
import { stringComparator } from '../../shared/utils';
import { DeckCardSet } from './deck-card-set';
import { cardOrdinalToID } from './deck-parser';

/**
 * Appends new cards and tags to destination deck.
 * Returns a modified copy of destination deck.
 * IDs of source deck will be changed to prevent collisions.
 */
export async function mergeDecks(dest: Deck, source: Deck): Promise<Deck> {
  return mergeIntoDeck(dest, DeckCardSet.fromDeck(source), source.tags);
}

/**
 * Returns a new deck with new cards added to destination deck.
 */
export function mergeIntoDeck(
  dest: Deck,
  cardset: DeckCardSet,
  extraTags: DeckTag[] = [],
): Deck {
  const updatedCardMap = updateCardsForMerge(dest, cardset);
  const updatedCards = new DeckCardSet(updatedCardMap.values());
  const destCopy = copyDeck(dest);
  destCopy.prompts.push(...updatedCards.prompts);
  destCopy.responses.push(...updatedCards.responses);
  // Merge tags:
  const tagMap = new Map<string, DeckTag>(
    destCopy.tags.map((tag) => [tag.name, tag]),
  );
  // TODO: filter out only relevant tags.
  extraTags.forEach((newTag) => {
    tagMap.set(newTag.name, newTag);
  });
  destCopy.tags = Array.from(tagMap.values());
  return destCopy;
}

/**
 * Returns copies of the given cards, with updated IDs to prevent
 * collisions with the source deck.
 * Returns a mapping of old cards to new cards.
 */
export function updateCardsForMerge(
  dest: Deck,
  cardset: DeckCardSet,
): Map<DeckCard, DeckCard> {
  // TODO: maybe refactor cards so that prompts and responses have unique IDs?
  // 1st mapping to update response IDs within the given cardset:
  const updatedMap = normalizeCardset(cardset);
  // 2nd mapping to update all IDs to merge into the deck:
  const mappedToDeck = normalizeCardIDs(
    combinedCardList(dest),
    Array.from(updatedMap.values()),
  );
  // Reuse the map instance to update results:
  for (const origCard of updatedMap.keys()) {
    let newCard = updatedMap.get(origCard)!;
    newCard = mappedToDeck.get(newCard)!;
    updatedMap.set(origCard, newCard);
  }
  return updatedMap;
}

/**
 * Returns copies of `sourceCards`, with updated IDs to prevent
 * collisions with `destCards`.
 * Returns a mapping from old cards to new cards.
 */
function normalizeCardIDs<T extends DeckCard>(
  destCards: DeckCard[],
  sourceCards: T[],
): Map<T, T> {
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
  // Sort source cards by ID to preserve order:
  sourceCards.sort((a, b) => stringComparator(a.id, b.id));
  return new Map(sourceCards.map((card) => [card, updateCardID(card)]));
}

/**
 * Returns copies of the given cards, with updated IDs to prevent collisions
 * between prompts and responses. Prompt IDs go before response IDs.
 * Returns a mapping from old cards to new cards.
 */
export function normalizeCardset(
  cardset: DeckCardSet,
): Map<DeckCard, DeckCard> {
  // Prompts are unchanged:
  const updatedMap: Map<DeckCard, DeckCard> = new Map(
    cardset.prompts.map((p) => [p, p]),
  );
  // Responses could change:
  const updatedResponseMap = normalizeCardIDs(
    cardset.prompts,
    cardset.responses,
  );
  for (const [origCard, newCard] of updatedResponseMap) {
    updatedMap.set(origCard, newCard);
  }
  return updatedMap;
}

/** Returns cards from the deck which exactly match the content of new cards. */
export async function findDuplicates(
  deck: Deck,
  query: DeckCardSet,
): Promise<DeckCardSet> {
  const out = new DeckCardSet([]);
  for (let prompt of query.prompts) {
    const match = findMatch(deck.prompts, prompt.content);
    if (match) out.add(match);
  }
  for (let res of query.responses) {
    const match = findMatch(deck.responses, res.content);
    if (match) out.add(match);
  }
  return out;
}

/** Returns the first card that exactly matches the content. */
function findMatch(cards: DeckCard[], content: string): DeckCard | null {
  return cards.find((c) => c.content === content) ?? null;
}
