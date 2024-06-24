import { expect, test } from 'vitest';
import {
  Deck,
  DeckTag,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../../shared/types';
import { parseDeckTsv } from '../deck-parser';
import { mergeDecks, mergeIntoDeck, normalizeCardset } from '../deck-merger';
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

  const expected = new Deck('test1', 'Test 1');
  expected.prompts = [
    new PromptDeckCard('0001', 'Hello, _', 1, 0, 0, 8, 0, ['lol'], 0, 0),
    new PromptDeckCard('0003', 'Bye _ and _', 2, 0, 0, 0, 0, ['wut'], 0, 0),
  ];
  expected.responses = [
    new ResponseDeckCard('0002', 'Poop', 0, 0, 9, 0, 0, 0, []),
    new ResponseDeckCard('0004', 'What', 0, 0, 0, 0, 0, 0, []),
  ];
  expected.tags = [new DeckTag('lol', 'Duplicate tag'), new DeckTag('wut')];
  expect(merged).toEqual(expected);
});

function makePrompt(id: string, text: string = 'Prompt'): PromptDeckCard {
  return new PromptDeckCard(id, text, 0, 0, 0, 0, 0, [], 0, 0);
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
  const normalized = normalizeCardset(set1);
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

  const normalized = normalizeCardset(set2);
  const newIDs = normalized.cards.map((c) => c.id);
  const newRespIDs = normalized.responses.map((c) => c.id);
  expect(newIDs).toEqual(['0010', '0011', '0012', '0013', '0014']);
  expect(resp11.id).toBe('0011');
  expect(newRespIDs).toEqual(['0012', '0013', '0014']);
});

test('merge into empty deck', () => {
  const newDeck = new Deck('new_deck', 'My new deck');
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
