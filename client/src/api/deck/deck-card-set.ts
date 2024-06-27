import {
  copyDeckCard,
  filterPromptDeckCard,
  filterResponseDeckCard,
} from '../../shared/deck-utils';
import {
  Deck,
  DeckCard,
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
}

export const emptySet = new DeckCardSet([]);
