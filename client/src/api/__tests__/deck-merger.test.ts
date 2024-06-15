import { expect, test } from 'vitest';
import {
  Deck,
  DeckTag,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../shared/types';
import { parseDeckTsv } from '../deck-parser';
import { mergeDecks } from '../deck-merger';

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
