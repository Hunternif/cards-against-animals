import {
  copyDeckCard,
  filterPromptDeckCard,
  filterResponseDeckCard,
  inferCardTier,
} from '../../shared/deck-utils';
import {
  allCardTiers,
  Deck,
  DeckCard,
  defaultLobbySettings,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../shared/types';
import { stringComparator } from '../../shared/utils';

/**
 * Convenience class for handling collections of cards which are not decks.
 * Maintains insertion order.
 */
export class DeckCardSet {
  public cards: DeckCard[];
  public prompts: PromptDeckCard[];
  public responses: ResponseDeckCard[];

  constructor(cards: Iterable<DeckCard>) {
    this.cards = Array.from(cards);
    this.prompts = this.cards.filter(filterPromptDeckCard);
    this.responses = this.cards.filter(filterResponseDeckCard);
  }

  static fromList(...items: (DeckCard | DeckCard[])[]) {
    return new DeckCardSet(new Array<DeckCard>().concat(...items));
  }

  static fromDeck(deck: Deck): DeckCardSet {
    return DeckCardSet.fromList(deck.prompts, deck.responses);
  }

  /** Assuming it's a map from old cards to new cards */
  static fromMap(map: Map<DeckCard, DeckCard>) {
    return new DeckCardSet(map.values());
  }

  get size(): number {
    return this.cards.length;
  }

  /** Creates deep copies of all cards in this set. */
  deepCopy(): DeckCardSet {
    return new DeckCardSet(this.cards.map((c) => copyDeckCard(c)));
  }

  /** Sorts cards by ID, modifies this cardset in place. */
  sortByIDs(): DeckCardSet {
    this.cards.sort((a, b) => stringComparator(a.id, b.id));
    return this;
  }

  /** Modifies this set by adding all cards from another set. Returns this. */
  append(other: DeckCardSet): DeckCardSet {
    this.cards.push(...other.cards);
    this.prompts.push(...other.prompts);
    this.responses.push(...other.responses);
    return this;
  }

  /** Adds new cards to the set. */
  add(...cards: DeckCard[]) {
    this.cards.push(...cards);
    this.prompts.push(...cards.filter(filterPromptDeckCard));
    this.responses.push(...cards.filter(filterResponseDeckCard));
  }

  /** Returns a new set containing only cards matching the filter. */
  filterByTags(tags: string[]): DeckCardSet {
    return new DeckCardSet(
      this.cards.filter((c) => tags.every((t) => c.tags.indexOf(t) > -1)),
    );
  }

  /** Returns a new set where cards are sorted by this field. */
  sortByField(field: keyof DeckCard, reversed: boolean = false): DeckCardSet {
    if (field === 'tier') return this.sortByInferredTier();
    const cards = this.cards.slice();
    cards.sort((a, b) => {
      const f1 = a[field];
      const f2 = b[field];
      if (f1 == null || f2 == null) return 1;
      if (f1 < f2) return reversed ? 1 : -1;
      if (f1 > f2) return reversed ? -1 : 1;
      return 0;
    });
    return DeckCardSet.fromList(cards);
  }

  /** Returns a new set where cards are sorted by tier, where tier could be inferred. */
  sortByInferredTier(): DeckCardSet {
    const cards = this.cards.slice();
    cards.sort((a, b) => {
      const t1 = a.tier ?? inferCardTier(a, defaultLobbySettings());
      const t2 = b.tier ?? inferCardTier(b, defaultLobbySettings());
      const i1 = allCardTiers.indexOf(t1);
      const i2 = allCardTiers.indexOf(t2);
      return i1 - i2;
    });
    return DeckCardSet.fromList(cards);
  }
}

export const emptySet = new DeckCardSet([]);
