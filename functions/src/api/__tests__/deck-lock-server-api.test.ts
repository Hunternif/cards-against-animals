import { DeckLock } from '@shared/types';
import { createDeckLock, verifyDeckPassword } from '../deck-lock-server-api';

const mockLockDb = new Map<string, DeckLock>();

jest.mock('../deck-lock-repository', () => ({
  __esModule: true, // this property makes it work
  getDeckLock: jest.fn((deckID: string) => mockLockDb.get(deckID)),
  setDeckLock: jest.fn((lock: DeckLock) => mockLockDb.set(lock.deck_id, lock)),
}));

test('get and set deck lock', async () => {
  const deckID = 'test_deck';
  // deck does not have a password:
  let pass = await verifyDeckPassword(deckID, '12345');
  expect(pass).toBe(true);

  // create a password:
  await createDeckLock(deckID, 'horsebatterystaple');
  const savedLock = mockLockDb.get(deckID)!;
  expect(savedLock.deck_id).toBe(deckID);
  expect(savedLock.hash).not.toBe('horsebatterystaple');

  pass = await verifyDeckPassword(deckID, '12345');
  expect(pass).toBe(false);
  pass = await verifyDeckPassword(deckID, 'horsebatterystaple');
  expect(pass).toBe(true);
});
