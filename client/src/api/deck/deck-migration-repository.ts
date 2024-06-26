import { collection, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase';
import { deckMigrationConverter } from '../../shared/firestore-converters';
import { Deck, DeckCard, DeckMigrationItem } from '../../shared/types';

const deckMigRef = collection(db, 'deck_migrations').withConverter(
  deckMigrationConverter,
);

/**
 * Saves records about cards copied from an old deck to a new deck.
 * @param map maps old card to new card
 */
export async function saveDeckMigrations(
  oldDeck: Deck,
  newDeck: Deck,
  map: Map<DeckCard, DeckCard>,
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    for (let [oldCard, newCard] of map) {
      const mig = new DeckMigrationItem(
        uniqueCardID(oldDeck, oldCard),
        uniqueCardID(newDeck, newCard),
        oldCard.type,
        oldDeck.id,
        oldCard.id,
        newDeck.id,
        newCard.id,
        // time_created is null, will populate on the server
      );
      transaction.set(doc(deckMigRef, mig.old_card_unique_id), mig);
    }
  });
}

function uniqueCardID(deck: Deck, card: DeckCard): string {
  return `${deck.id}_${card.type}_${card.id}`;
}
