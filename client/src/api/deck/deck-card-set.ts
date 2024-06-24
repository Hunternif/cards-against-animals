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

  static fromDeck(deck: Deck): DeckCardSet {
    return new DeckCardSet(
      new Array<DeckCard>().concat(deck.prompts, deck.responses),
    );
  }

  get size(): number {
    return this.cards.length;
  }

  /** Creates deep copies of all cards in this set. */
  deepCopy(): DeckCardSet {
    return new DeckCardSet(this.cards.map((c) => copyDeckCard(c)));
  }

  /** Modifies this set by adding all cards from another set. Returns this. */
  append(other: DeckCardSet): DeckCardSet {
    this.cards.push(...other.cards);
    this.prompts.push(...other.prompts);
    this.responses.push(...other.responses);
    return this;
  }
}

export const emptySet = new DeckCardSet([]);
