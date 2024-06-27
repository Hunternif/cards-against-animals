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
    const deck = new Deck(d.id, d.title);
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
            c.tags ?? [],
            c.upvotes ?? 0,
            c.downvotes ?? 0,
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
          ),
      ) ?? [];
    deck.tags = d.tags?.map((t) => new DeckTag(t.name, t.description)) ?? [];
    return deck;
  });
}

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

type PartialCard<T> = {
  [P in keyof Omit<T, 'type'>]: T[P] extends Number
    ? number | undefined
    : T[P] extends Array<string>
    ? Array<string> | undefined
    : T[P];
};

type PromptDeckCardJson = PartialCard<PromptDeckCard>;
type ResponseDeckCardJson = PartialCard<ResponseDeckCard>;
