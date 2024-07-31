import { Query, Transaction } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import {
  CardInGame,
  Deck,
  GameLobby,
  ResponseCardInGame,
  ResponseCardInHand,
  TagInGame,
  anyTagsKey,
  noTagsKey,
} from '../shared/types';
import { stringComparator } from '../shared/utils';
import { getLobbyDeckResponsesRef } from './lobby-server-repository';

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
    [anyTagsKey, new TagInGame(1, anyTagsKey, 0)],
    [noTagsKey, new TagInGame(2, noTagsKey, 0)],
  ]);
  for (const deck of decks) {
    for (const tag of deck.tags) {
      tagMap.set(
        tag.name,
        new TagInGame(tagMap.size + 1, tag.name, 0, tag.description),
      );
    }
  }
  const counts = countCardsPerTag(allResponses);
  for (const [tagName, count] of counts) {
    let tag = tagMap.get(tagName);
    if (tag == null) {
      tag = new TagInGame(tagMap.size + 1, tagName, 0);
      tagMap.set(tagName, tag);
    }
    tag.card_count = count;
  }
  return tagMap;
}

/**
 * Updates lobby.response_tags data, assuming that the given cards
 * haven been dealt (i.e. removed from the pool of remaining deck cards).
 * Doesn't commit to the DB because following calls will do it.
 */
export function updateTagCountsForDeal(
  lobby: GameLobby,
  dealtCards: ResponseCardInGame[],
): GameLobby {
  for (const card of dealtCards) {
    lobby.response_tags.get(anyTagsKey)!.card_count -= 1;
    if (card.tags.length === 0) {
      lobby.response_tags.get(noTagsKey)!.card_count -= 1;
    }
    for (const tagName of card.tags) {
      const tagData = lobby.response_tags.get(tagName);
      if (tagData != null) {
        tagData.card_count -= 1;
      }
    }
  }
  return lobby;
}

/** Creates a Firestore query to fetch response cards for the given tag */
function getCardQueryForTag(
  lobbyID: string,
  tagName: string,
): Query<ResponseCardInGame> {
  let query: Query<ResponseCardInGame> = getLobbyDeckResponsesRef(lobbyID);
  switch (tagName) {
    case anyTagsKey:
      break;
    case noTagsKey:
      query = query.where('tags', '==', []);
      break;
    default:
      query = query.where('tags', 'array-contains', tagName);
      break;
  }
  return query;
}

type GroupedTag = {
  tagName: string;
  count: number;
};

/**
 * 1. Sorts tags so that specific tags come first.
 * 2. Then groups tags by name to optimize requests and prevent duplicates.
 */
export function sortAndGroupTags(tagNames: string[]): GroupedTag[] {
  const map = new Map<string, GroupedTag>();
  for (const name of tagNames) {
    const value = map.get(name);
    if (value) {
      value.count++;
    } else {
      map.set(name, { tagName: name, count: 1 });
    }
  }
  const out = new Array<GroupedTag>();
  for (const [name, value] of map.entries()) {
    if (name != anyTagsKey) {
      out.push(value);
    }
  }
  out.sort((a, b) => stringComparator(a.tagName, b.tagName));
  const anyTagGroup = map.get(anyTagsKey);
  if (anyTagGroup) {
    out.push(anyTagGroup);
  }
  return out;
}

export interface CardTagRepository {
  query(
    lobbyID: string,
    tagName: string,
    limit: number,
  ): Promise<ResponseCardInGame[]>;
}

/**
 * Fetches cards from Firestore.
 * @param tagNames will attempt to fetch for these tags first.
 *        Falls back to cards with any tag.
 * @param cardLimit will attempt to fetch this total number of cards.
 */
export async function fetchCardsForTags(
  lobbyID: string,
  tagNames: string[],
  cardLimit: number,
  repository: CardTagRepository,
): Promise<ResponseCardInHand[]> {
  // Map cards by IDs:
  const newCards = new Map<string, ResponseCardInHand>();

  // Sort tags so that specific tags come first,
  // and Group by name to optimize requests and prevent duplicates:
  const groupedTags = sortAndGroupTags(tagNames);

  // Append a catch-all "any tag" group at the end, just in case
  // if we don't find enough tagged cards:
  groupedTags.push({ tagName: anyTagsKey, count: cardLimit });

  for (const groupedTag of groupedTags) {
    // Don't exceed card limit:
    if (newCards.size >= cardLimit) break;
    const newCardResult = (
      await repository.query(
        lobbyID,
        groupedTag.tagName,
        // Need to request extra cards because multiple tags can overlap:
        groupedTag.count + newCards.size,
      )
    ).map((c) => ResponseCardInHand.create(c, new Date()));
    logger.info(`Fetched ${newCardResult.length} cards`);

    // Some of these cards may have been added already due to overlap,
    // so need to check every card ID:
    let addedCount = 0;
    for (const card of newCardResult) {
      if (addedCount >= groupedTag.count || newCards.size >= cardLimit) break;
      if (!newCards.has(card.id)) {
        newCards.set(card.id, card);
        addedCount++;
      }
    }
  }
  return [...newCards.values()];
}

/** Same as fetchCardsForTags but with a Firestore transaction */
export async function fetchCardsForTagsWithTransaction(
  lobbyID: string,
  tagNames: string[],
  cardLimit: number,
  transaction: Transaction,
) {
  return fetchCardsForTags(
    lobbyID,
    tagNames,
    cardLimit,
    new CardTagQueryFirestoreRepo(transaction),
  );
}

class CardTagQueryFirestoreRepo implements CardTagRepository {
  constructor(private transaction: Transaction) {}
  async query(
    lobbyID: string,
    tagName: string,
    limit: number,
  ): Promise<ResponseCardInGame[]> {
    return (
      await this.transaction.get(
        getCardQueryForTag(lobbyID, tagName)
          .orderBy('random_index', 'desc')
          // Need to request extra cards because multiple tags can overlap:
          .limit(limit),
      )
    ).docs.map((d) => d.data());
  }
}
