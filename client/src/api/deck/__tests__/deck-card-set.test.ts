import { expect, test } from 'vitest';
import { PromptDeckCard, ResponseDeckCard } from '../../../shared/types';
import { DeckCardSet } from '../deck-card-set';

const prompt1 = new PromptDeckCard(
  '0001',
  'Hello, _',
  1,
  0,
  0,
  8,
  0,
  0,
  ['lol'],
  0,
  0,
);
const prompt2 = new PromptDeckCard(
  '0003',
  'Bye _ and _',
  2,
  0,
  0,
  0,
  0,
  0,
  ['wut'],
  0,
  0,
);
const resp1 = new ResponseDeckCard('0002', 'Poop', 0, 0, 9, 0, 0, 0, []);
const resp2 = new ResponseDeckCard('0004', 'What', 0, 0, 0, 0, 0, 0, []);

test('create DeckCardSet', () => {
  const set1 = new DeckCardSet([prompt1, prompt2, resp1, resp2]);
  expect(set1.prompts).toEqual([prompt1, prompt2]);
  expect(set1.responses).toEqual([resp1, resp2]);

  const set2 = DeckCardSet.fromList([prompt1, resp1], [prompt2, resp2]);
  expect(set2.cards).toEqual([prompt1, resp1, prompt2, resp2]);
  expect(set2.prompts).toEqual([prompt1, prompt2]);
  expect(set2.responses).toEqual([resp1, resp2]);
});

test('copy DeckCardSet', () => {
  const set1 = new DeckCardSet([prompt1, prompt2, resp1, resp2]);
  const copy = set1.deepCopy();
  expect(copy.cards).toEqual([prompt1, prompt2, resp1, resp2]);
  expect(copy.prompts).toEqual([prompt1, prompt2]);
  expect(copy.responses).toEqual([resp1, resp2]);

  copy.cards[0].id = '9999';
  expect(set1.cards[0].id).toEqual('0001');
});

test('append DeckCardSet', () => {
  const set1 = new DeckCardSet([prompt1, resp1]);
  const set2 = new DeckCardSet([prompt2, resp2]);
  set1.append(set2);
  expect(set1.cards).toEqual([prompt1, resp1, prompt2, resp2]);
  expect(set1.prompts).toEqual([prompt1, prompt2]);
  expect(set1.responses).toEqual([resp1, resp2]);
});

test('add to DeckCardSet', () => {
  const set1 = new DeckCardSet([prompt1, resp1]);

  set1.add(prompt2);
  expect(set1.cards).toEqual([prompt1, resp1, prompt2]);
  expect(set1.prompts).toEqual([prompt1, prompt2]);
  expect(set1.responses).toEqual([resp1]);

  set1.add(resp2);
  expect(set1.cards).toEqual([prompt1, resp1, prompt2, resp2]);
  expect(set1.prompts).toEqual([prompt1, prompt2]);
  expect(set1.responses).toEqual([resp1, resp2]);
});

test('sort DeckCardSet', () => {
  const resR1 = makeResponse('r1');
  resR1.rating = 1;
  const proR2 = makePrompt('r2');
  proR2.rating = 2;
  const resR3 = makeResponse('r3');
  resR3.rating = 3;
  const proR4 = makePrompt('r4');
  proR4.rating = 4;

  const set1 = new DeckCardSet([proR2, resR3, resR1, proR4]);
  expect(set1.cards).toEqual([proR2, resR3, resR1, proR4]);
  expect(set1.prompts).toEqual([proR2, proR4]);
  expect(set1.responses).toEqual([resR3, resR1]);

  const set2 = set1.sortByField('rating');
  expect(set2.cards).toEqual([resR1, proR2, resR3, proR4]);
  expect(set2.prompts).toEqual([proR2, proR4]);
  expect(set2.responses).toEqual([resR1, resR3]);
});

function makePrompt(id: string, text: string = 'Prompt'): PromptDeckCard {
  return new PromptDeckCard(id, text, 0, 0, 0, 0, 0, 0, [], 0, 0);
}
function makeResponse(id: string, text: string = 'Response'): ResponseDeckCard {
  return new ResponseDeckCard(id, text, 0, 0, 0, 0, 8, 0, []);
}
