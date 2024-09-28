import { saveAs } from 'file-saver';
import {
  Deck,
  DeckTag,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../shared/types';
import { IDeckRepository } from './deck-repository';

/**
 * Downloads deck data from the server and saves it as a local file.
 */
export async function exportDecksToFile(repo: IDeckRepository) {
  repo.clearCache();
  const decks = await repo.getDecks([]);
  const completeDecks = await Promise.all(
    decks.map((d) => repo.downloadDeck(d.id)),
  );
  const exportData: DeckExportData = {
    version: 1,
    date_created: new Date().toISOString(),
    decks: completeDecks,
  };

  const blob = new Blob([serializeDeckForExport(exportData)], {
    type: 'application/json',
  });
  saveAs(blob, `caa_decks_${exportData.date_created}.json`);
}

/** Serializes deck to JSON, omitting empty fields. */
export function serializeDeckForExport(data: DeckExportData) {
  return JSON.stringify(data, jsonReplacer, '  ');
}

/** Deserializes deck from JSON. */
export function deserializeDecks(json: string): Deck[] {
  const data = JSON.parse(json) as DeckExportData;
  if (data.version != 1)
    throw new Error(`Unsupported export version ${data.version}`);
  return data.decks.map((d) => {
    const tags = d.tags?.map((t) => new DeckTag(t.name, t.description)) ?? [];
    const deck = new Deck(d.id, d.title, d.visibility, tags, d.time_created);
    deck.prompts =
      d.prompts?.map(
        (c) =>
          new PromptDeckCard(
            c.id,
            c.content,
            c.pick ?? 0,
            c.rating ?? 0,
            c.views ?? 0,
            c.plays ?? 0,
            c.discards ?? 0,
            c.likes ?? 0,
            c.tags ?? [],
            c.upvotes ?? 0,
            c.downvotes ?? 0,
            c.tier,
            c.tier_history,
            c.time_created,
          ),
      ) ?? [];
    deck.responses =
      d.responses?.map(
        (c) =>
          new ResponseDeckCard(
            c.id,
            c.content,
            c.rating ?? 0,
            c.views ?? 0,
            c.plays ?? 0,
            c.discards ?? 0,
            c.wins ?? 0,
            c.likes ?? 0,
            c.tags ?? [],
            c.tier,
            c.tier_history,
            c.time_created,
            c.action,
          ),
      ) ?? [];
    return deck;
  });
}

/**
 * During serialization of cards, removes the field 'type', any 0 numbers and
 * empty arrays, to save space.
 */
function jsonReplacer(this: any, key: string, value: any): any {
  if (typeof value === 'number' && value === 0) return undefined;
  else if (Array.isArray(value) && value.length === 0) return undefined;
  else if (
    key === 'type' &&
    (this instanceof PromptDeckCard || this instanceof ResponseDeckCard)
  )
    return undefined;
  else return value;
}

/** Some fields are made optional */
export type DeckExportData = {
  version: number;
  /** ISO string */
  date_created: string;
  decks: DeckJson[];
};

type DeckJson = Omit<Deck, 'prompts' | 'responses' | 'tags'> & {
  prompts?: PromptDeckCardJson[];
  responses?: ResponseDeckCardJson[];
  tags?: DeckTag[];
};

/**
 * Copies all fields except 'type' and any 0 numbers or empty arrays,
 * to save space.
 */
type PartialCard<T> = {
  [P in keyof Omit<T, 'type'>]: T[P] extends Number
    ? number | undefined
    : T[P] extends Array<any>
    ? T[P] | undefined
    : T[P];
};

type PromptDeckCardJson = PartialCard<PromptDeckCard>;
type ResponseDeckCardJson = PartialCard<ResponseDeckCard>;
