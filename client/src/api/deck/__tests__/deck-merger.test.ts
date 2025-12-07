import { expect, test } from 'vitest';
import {
  Deck,
  DeckTag,
  PromptDeckCard,
  ResponseDeckCard,
} from '@shared/types';
import { parseDeckTsv } from '../deck-parser';
import {
  makeNewID,
  mergeDecks,
  mergeIntoDeck,
  normalizeCardset,
  updateCardsForMerge,
} from '../deck-merger';
import { DeckCardSet } from '../deck-card-set';

//TODO: add test for custom-formatted IDs
test('merge decks', async () => {
  const deck1 = parseDeckTsv(
    'test1',
    'Test 1',
    `Type\tText\tTags...
  Prompt\tHello, __\tlol\t\t\t
  Response\tPoop`,
    `lol\tFirst tag`,
  );
  deck1.prompts[0].plays = 8;
  deck1.responses[0].plays = 9;

  const deck2 = parseDeckTsv(
    'test2',
    'Test 2',
    `Type\tText\tTags...
  Prompt\tBye __ and _\t\twut
  Response\tWhat`,
    `wut
  lol\tDuplicate tag`,
  );

  const merged = await mergeDecks(deck1, deck2);

  const expected = new Deck('test1', 'Test 1', 'public');
  expected.prompts = [
    new PromptDeckCard('0001', 'Hello, _', 1, 0, 0, 8, 0, 0, ['lol'], 0, 0),
    new PromptDeckCard('0003', 'Bye _ and _', 2, 0, 0, 0, 0, 0, ['wut'], 0, 0),
  ];
  expected.responses = [
    new ResponseDeckCard('0002', 'Poop', 0, 0, 9, 0, 0, 0, []),
    new ResponseDeckCard('0004', 'What', 0, 0, 0, 0, 0, 0, []),
  ];
  expected.tags = [new DeckTag('lol', 'Duplicate tag'), new DeckTag('wut')];
  expect(merged).toEqual(expected);
});

function makePrompt(id: string, text: string = 'Prompt'): PromptDeckCard {
  return new PromptDeckCard(id, text, 0, 0, 0, 0, 0, 0, [], 0, 0);
}
function makeResponse(id: string, text: string = 'Response'): ResponseDeckCard {
  return new ResponseDeckCard(id, text, 0, 0, 0, 0, 8, 0, []);
}

test('normalize cardset without collisions does nothing', () => {
  const set1 = new DeckCardSet([
    makePrompt('0001'),
    makePrompt('0003'),
    makeResponse('0002'),
    makeResponse('0004'),
  ]);
  const normalizedMap = normalizeCardset(set1);
  const normalized = new DeckCardSet(normalizedMap.values());
  const newIDs = normalized.cards.map((c) => c.id);
  expect(newIDs).toEqual(['0001', '0003', '0002', '0004']);
  expect(normalized.responses[0].id).toBe('0002');
});

test('normalize cardset with collisions updates IDs', () => {
  const prompt10 = makePrompt('0010');
  const prompt11 = makePrompt('0011');
  const resp10 = makeResponse('0010');
  const resp11 = makeResponse('0011');
  const resp12 = makeResponse('0012');
  const set2 = new DeckCardSet([prompt10, prompt11, resp10, resp11, resp12]);

  const normalizedMap = normalizeCardset(set2);
  const normalized = new DeckCardSet(normalizedMap.values());
  const newIDs = normalized.cards.map((c) => c.id);
  const newRespIDs = normalized.responses.map((c) => c.id);
  expect(newIDs).toEqual(['0010', '0011', '0012', '0013', '0014']);
  expect(resp11.id).toBe('0011');
  expect(newRespIDs).toEqual(['0012', '0013', '0014']);
  expect(normalizedMap.get(resp10)!.id).toBe('0012');
  expect(normalizedMap.get(resp11)!.id).toBe('0013');
  expect(normalizedMap.get(resp12)!.id).toBe('0014');
});

test('update card IDs for merge', () => {
  const prompt10 = makePrompt('0010');
  const prompt11 = makePrompt('0011');
  const resp10 = makeResponse('0010');
  const resp11 = makeResponse('0011');
  const resp12 = makeResponse('0012');

  const deck = new Deck('test_deck', 'Test deck', 'public');
  deck.prompts.push(makePrompt('0010'));
  deck.responses.push(makeResponse('0010'));
  const set1 = new DeckCardSet([prompt10, prompt11, resp10, resp11, resp12]);

  const updatedMap = updateCardsForMerge(deck, set1);
  expect(Array.from(updatedMap.keys())).toEqual(set1.cards);
  expect(updatedMap.get(prompt10)!.id).toBe('0011');
  expect(updatedMap.get(prompt11)!.id).toBe('0012');
  expect(updatedMap.get(resp10)!.id).toBe('0013');
  expect(updatedMap.get(resp11)!.id).toBe('0014');
  expect(updatedMap.get(resp12)!.id).toBe('0015');
});

test('maintain relative ID order', () => {
  const prompt1 = makePrompt('0001');
  const resp2 = makeResponse('0002');
  const prompt3 = makePrompt('0003');
  const resp4 = makeResponse('0004');

  const deck = new Deck('test_deck', 'Test deck', 'public');
  deck.prompts.push(makePrompt('0001'));
  deck.responses.push(makeResponse('0002'));
  const set1 = new DeckCardSet([prompt1, resp2, prompt3, resp4]);

  const updatedMap = updateCardsForMerge(deck, set1);
  expect(updatedMap.get(prompt1)!.id).toBe('0003');
  expect(updatedMap.get(resp2)!.id).toBe('0004');
  expect(updatedMap.get(prompt3)!.id).toBe('0005');
  expect(updatedMap.get(resp4)!.id).toBe('0006');
});

test('merge into empty deck', () => {
  const newDeck = new Deck('new_deck', 'My new deck', 'public');
  newDeck.tags.push(new DeckTag('old_tag'));
  const set1 = new DeckCardSet([
    makePrompt('0001', 'New prompt'),
    makeResponse('0001', 'New response'),
  ]);
  const tag1 = new DeckTag('new_tag');

  const merged = mergeIntoDeck(newDeck, set1, [tag1]);
  expect(merged.prompts[0]).toEqual(makePrompt('0001', 'New prompt'));
  expect(merged.responses[0]).toEqual(makeResponse('0002', 'New response'));
  expect(merged.tags).toEqual([new DeckTag('old_tag'), new DeckTag('new_tag')]);
});

test('make new ID', () => {
  // empty deck:
  const deck = new Deck('new_deck', 'My new deck', 'public');
  expect(makeNewID(deck)).toBe('0001');

  // add 1 prompt card:
  deck.prompts.push(makePrompt('0001'));
  expect(makeNewID(deck)).toBe('0002');

  // add 1 more prompt card:
  deck.prompts.push(makePrompt('0034'));
  expect(makeNewID(deck)).toBe('0035');

  // add 1 response card:
  deck.responses.push(makeResponse('0035'));
  expect(makeNewID(deck)).toBe('0036');
})