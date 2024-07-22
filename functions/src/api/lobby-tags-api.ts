import {
  CardInGame,
  Deck,
  ResponseCardInGame,
  TagInGame,
} from '../shared/types';

/** Counts cards for each tag. */
export function countCardsPerTag(
  cards: Iterable<CardInGame>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const card of cards) {
    for (const tag of card.tags) {
      const count = map.get(tag) ?? 0;
      map.set(tag, count + 1);
    }
  }
  return map;
}

/**
 * Counts cards for each tag in every deck.
 * @param decks used to provide tag descriptions.
 * @param responses is assumed to contain cards from all decks combined.
 */
export function countResponseTags(
  decks: Deck[],
  allResponses: ResponseCardInGame[],
): Map<string, TagInGame> {
  const tagMap = new Map<string, TagInGame>(); // Maps by tag name.
  for (const deck of decks) {
    for (const tag of deck.tags) {
      tagMap.set(tag.name, new TagInGame(tag.name, 0, tag.description));
    }
  }
  const counts = countCardsPerTag(allResponses);
  for (const [tagName, count] of counts) {
    let tag = tagMap.get(tagName);
    if (tag == null) {
      tag = new TagInGame(tagName, 0);
      tagMap.set(tagName, tag);
    }
    tag.card_count = count;
  }
  return tagMap;
}
