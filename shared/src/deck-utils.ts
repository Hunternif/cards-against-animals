import {
  Deck,
  DeckCard,
  DeckTag,
  PromptDeckCard,
  ResponseDeckCard,
} from './types';
import { assertExhaustive } from './utils';

export function combinedCardList(deck: Deck): DeckCard[] {
  const list: DeckCard[] = deck.prompts;
  return list.concat(deck.responses);
}

export function filterPromptDeckCard(card: DeckCard): card is PromptDeckCard {
  return card.type === 'prompt';
}

export function filterResponseDeckCard(
  card: DeckCard,
): card is ResponseDeckCard {
  return card.type === 'response';
}

export function copyDeck(deck: Deck): Deck {
  const copy = new Deck(
    deck.id,
    deck.title,
    deck.visibility,
    deck.tags.map((t) => new DeckTag(t.name, t.description)),
    deck.time_created,
  );
  copy.prompts.push(...deck.prompts);
  copy.responses.push(...deck.responses);
  return copy;
}

export function copyDeckCard<
  T extends DeckCard | PromptDeckCard | ResponseDeckCard,
>(card: T): T {
  if (filterPromptDeckCard(card)) {
    return new PromptDeckCard(
      card.id,
      card.content,
      card.pick,
      card.rating,
      card.views,
      card.plays,
      card.discards,
      card.likes,
      card.tags.slice(),
      card.upvotes,
      card.downvotes,
      card.time_created,
    ) as T;
  } else if (filterResponseDeckCard(card)) {
    return new ResponseDeckCard(
      card.id,
      card.content,
      card.rating,
      card.views,
      card.plays,
      card.discards,
      card.wins,
      card.likes,
      card.tags.slice(),
      card.time_created,
      card.action,
    ) as T;
  } else {
    throw new Error(`Unsupported card class. Card id ${card.id}`);
    // TODO: there must be a way to do this cleanly.
  }
}

/** Formats prompt text for display, making gaps longer. */
export function formatPrompt(text: string): string {
  return text.replace(/_+/g, "______");
}

/**
 * Prompts and responses can have the same ID.
 * This function returns a prefixed ID that is unique in a list containing
 * both prompts and responses.
 * TODO: move this to the DeckCard class.
 */
export function cardTypedID(card: DeckCard): string {
  return card.type + card.id;
}
