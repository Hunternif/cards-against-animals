import {
  Deck,
  DeckTag,
  PromptDeckCard,
  ResponseDeckCard,
} from '@shared/types';

/**
 * Parses collection data. `promptList` and `responseList` are strings where
 * each line is a new entry.
 */
export function parseDeck(
  id: string,
  title: string,
  promptList: string,
  responseList: string,
): Deck {
  const deck = new Deck(id, title, 'public');
  deck.prompts = promptList
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line != '')
    .map((line, i) => {
      try {
        const id = cardOrdinalToID(i + 1);
        const pick = parsePromptPick(line);
        const text = processPromptText(processCardText(line));
        return new PromptDeckCard(id, text, pick, 0, 0, 0, 0, 0, [], 0, 0);
      } catch (e: any) {
        const error = new Error(`Error parsing prompt card row ${i + 1}`);
        error.stack += `\nCaused by: ${e}`;
        throw error;
      }
    });
  const promptCount = deck.prompts.length;
  deck.responses = responseList
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line != '')
    .map((line, i) => {
      try {
        const id = cardOrdinalToID(promptCount + i + 1);
        const text = processCardText(line);
        return new ResponseDeckCard(id, text, 0, 0, 0, 0, 0, 0, []);
      } catch (e: any) {
        const error = new Error(`Error parsing response card row ${i + 1}`);
        error.stack += `\nCaused by: ${e}`;
        throw error;
      }
    });
  return deck;
}

/**
 * Parses deck TSV data
 */
export function parseDeckTsv(
  id: string,
  title: string,
  cardData: string,
  tagData: string,
): Deck {
  const deck = new Deck(id, title, 'public');
  const cardLines = cardData
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line != '');
  const tagsInCards = new Array<string>();
  // Skip row of headers
  if (cardLines.length > 0 && cardLines[0].startsWith('Type')) {
    cardLines.splice(0, 1);
  }
  cardLines.forEach((line, i) => {
    let type = 'unknown';
    try {
      const id = cardOrdinalToID(i + 1);
      const items = line.split('\t');
      type = items[0];
      const rawText = items[1];
      const tags = items.splice(2).filter((c) => c != '');
      tagsInCards.push(...tags);
      if (type === 'Prompt') {
        const text = processPromptText(processCardText(rawText));
        const pick = parsePromptPick(text);
        deck.prompts.push(
          new PromptDeckCard(id, text, pick, 0, 0, 0, 0, 0, tags, 0, 0),
        );
      } else if (type === 'Response') {
        const text = processCardText(items[1]);
        deck.responses.push(
          new ResponseDeckCard(id, text, 0, 0, 0, 0, 0, 0, tags),
        );
      }
    } catch (e: any) {
      const error = new Error(`Error parsing ${type} card row ${i + 1}`);
      error.stack += `\nCaused by: ${e}`;
      throw error;
    }
  });

  // Tags accumulated so far:
  const tagMap = new Map<string, DeckTag>();
  for (const tag of tagsInCards) {
    tagMap.set(tag, new DeckTag(tag));
  }

  // Update tag descriptions:
  const tagLines = tagData
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line != '');
  if (tagLines.length > 0) {
    // Skip row of headers
    if (tagLines[0].startsWith('Tag')) tagLines.splice(0, 1);
    for (const line of tagLines) {
      const items = line.split('\t');
      const knownTag = tagMap.get(items[0]);
      if (knownTag) knownTag.description = items[1];
      else tagMap.set(items[0], new DeckTag(items[0], items[1]));
    }
  }
  deck.tags = Array.from(tagMap.values());
  return deck;
}

/** Extracts the number of gaps to fill, e.g.:
 * "I like __ and _" => 2. */
export function parsePromptPick(text: string): number {
  // Remove markup like "_words words_":
  text = text.replace(/(_[^_"'«»\s.,:;!?\-~]|[^_"'«»\s.,:;!?\-~]_)/g, '');
  const match = text.match(/(_+)/g);
  // Minimum number is 1, in case the __ is omitted.
  if (!match) return 1;
  // The first matched element is included twice:
  else return match.length;
}

/** Re-formats text if necessary */
export function processCardText(text: string): string {
  return text.replace(/\\n/g, '\n');
}

/** Re-formats specifically the gaps in prompt cards, to be '_' */
export function processPromptText(text: string): string {
  text = text.replace(/_+/g, '_');
  text = text.replace(/(^|\s)_([\s.,:;!?\-~]|$)/g, '$1_$2');
  return text;
}

export function cardOrdinalToID(ordinal: number): string {
  return String(ordinal).padStart(4, '0');
}

/** 🦌 */
export function detectDeer(text: string): boolean {
  const lowText = text.toLowerCase();
  return (
    /(^|\s)олен/.test(lowText) ||
    /(^|\s)арви/.test(lowText) ||
    lowText.includes('🦌')
  );
}

/** 👑 */
export function detectLenich(text: string): boolean {
  const lowText = text.toLowerCase();
  return (
    /(^|\s)ленич/.test(lowText) ||
    /(^|\s)леонид/.test(lowText) ||
    lowText.includes('👑')
  );
}

/** 🐈 */
export function detectCat(text: string): boolean {
  const lowText = text.toLowerCase();
  return (
    /(^|\s)кот([\s,]|$)/.test(lowText) ||
    /(^|\s)котик([\s,]|$)/.test(lowText) ||
    /(^|\s)кошьк/.test(lowText) ||
    /(^|\s)кошк/.test(lowText) ||
    /(^|\s)мяу/.test(lowText) ||
    lowText.includes('🐈')
  );
}

/**
 * Returns true if the string contains only emojis and whitespace.
 * From https://stackoverflow.com/a/73634247/1093712
 */
export function isOnlyEmojis(str: string): boolean {
  const stringToTest = str.replace(/\s/g, '');
  const emojiRegex =
    /^(?:(?:\p{RI}\p{RI}|\p{Emoji}(?:\p{Emoji_Modifier}|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?(?:\u{200D}\p{Emoji}(?:\p{Emoji_Modifier}|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?)*)|[\u{1f900}-\u{1f9ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}])+$/u;
  return emojiRegex.test(stringToTest) && Number.isNaN(Number(stringToTest));
}
