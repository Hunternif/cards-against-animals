import { Deck, DeckCard, DeckTag } from '../shared/types';
import { cardOrdinalToID } from './deck-parser';

/**
 * Loads destination deck, appends new values from source deck, uploads data.
 * IDs of source deck will be changed to prevent collisions.
 */
export async function mergeDecks(dest: Deck, source: Deck): Promise<Deck> {
  // Assuming card ID format to be '0001'.
  const idRegex = /^\d{4}$/;
  let topID = -1;
  const usedIDs = new Set<string>();
  function processExistingID(idStr: string) {
    usedIDs.add(idStr);
    if (idRegex.test(idStr)) {
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        topID = Math.max(topID, id);
      }
    }
  }
  function updateCardID<T extends DeckCard>(card: T): T {
    if (topID > -1 && idRegex.test(card.id)) {
      const iCardID = parseInt(card.id);
      if (!isNaN(iCardID)) {
        let newID = cardOrdinalToID(topID + iCardID);
        if (usedIDs.has(newID)) {
          throw Error(`Couldn't merge. Duplicate ID ${newID}`);
        }
        usedIDs.add(newID);
        card.id = newID;
      }
    }
    return card;
  }
  dest.prompts.forEach((card) => processExistingID(card.id));
  dest.responses.forEach((card) => processExistingID(card.id));
  dest.prompts.push(...source.prompts.map((card) => updateCardID(card)));
  dest.responses.push(...source.responses.map((card) => updateCardID(card)));
  // Merge tags:
  const tagMap = new Map<string, DeckTag>(
    dest.tags.map((tag) => [tag.name, tag]),
  );
  source.tags.forEach((newTag) => {
    tagMap.set(newTag.name, newTag);
  });
  dest.tags = Array.from(tagMap.values());
  return dest;
}
