import {
  CardInGame,
  Deck,
  ResponseCardInGame,
  TagInGame,
  anyTagsKey,
  noTagsKey,
} from '../shared/types';

/** Counts cards for each tag. */
export function countCardsPerTag(
  cards: Iterable<CardInGame>,
): Map<string, number> {
  const map = new Map<string, number>([
    [anyTagsKey, 0],
    [noTagsKey, 0],
  ]);
  for (const card of cards) {
    map.set(anyTagsKey, map.get(anyTagsKey)! + 1);
    if (card.tags.length === 0) {
      map.set(noTagsKey, map.get(noTagsKey)! + 1);
    }
    for (const tag of card.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
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
  // Maps by tag name:
  const tagMap = new Map<string, TagInGame>([
    [anyTagsKey, new TagInGame(anyTagsKey, 0)],
    [noTagsKey, new TagInGame(noTagsKey, 0)],
  ]);
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
