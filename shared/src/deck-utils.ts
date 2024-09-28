import {
  CardTier,
  Deck,
  DeckCard,
  DeckTag,
  LobbySettings,
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
      card.tier,
      card.tier_history.slice(),
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
      card.tier,
      card.tier_history.slice(),
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
  return text.replace(/_+/g, '______');
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

/** Calculates a factor from 0 to 1 that determines card's value for sorting. */
export function getCardFactor(card: DeckCard, settings: LobbySettings): number {
  let factor = 1.0;
  // Adjust index based on rating:
  if (settings.sort_cards_by_rating) {
    factor *= (100.0 + card.rating * 40.0) / 100.0;
  }
  // (card.plays / 2.0 + 1.0) *
  if (settings.sort_cards_by_views) {
    factor *= 1.0 / (card.views / 10.0 + 1.0);
  }
  if (settings.sort_cards_by_wins) {
    factor *= card.wins + 1.0;
  }
  if (settings.sort_cards_by_discards) {
    factor *= 1.0 / (card.discards * 10.0 + 1.0);
  }
  // Adjust prompt cards based on votes:
  if (settings.sort_cards_by_prompt_votes && card instanceof PromptDeckCard) {
    factor *=
      (2 * Math.max(0, card.upvotes - card.downvotes) + 1.0) *
      (1.0 / (Math.max(0, card.downvotes - card.upvotes) * 10.0 + 1.0));
  }
  // Adjust response cards based on likes:
  if (
    settings.sort_cards_by_response_likes &&
    card instanceof ResponseDeckCard
  ) {
    factor *= 1.0 + card.likes / 2.0;
  }
  // TODO: make this a controllable slope instead.
  // Minimum possible factor:
  factor = Math.max(0.000000001, factor); // Prevent 0
  factor = Math.max(settings.sort_min_factor, factor);
  // Maximum possible factor (don't allow putting cards ahead of the queue):
  if (!settings.sort_cards_in_front) {
    factor = Math.min(factor, 1.0);
  }
  return factor;
}

/**
 * If the card already has a tier, returns it.
 * Otherwise, decides card tier based on likes etc.
 */
export function inferCardTier(
  card: DeckCard,
  settings: LobbySettings,
): CardTier {
  if (card.tier) return card.tier;
  // TODO: apply different rules to prompts and responses.
  const factor = getCardFactor(card, settings);
  if (factor > 0.5) return 'top';
  if (factor < 0.05) return 'shit';
  return 'mid';
}
