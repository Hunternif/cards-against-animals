import { expect, test } from "vitest";
import { PromptDeckCard, ResponseDeckCard } from "../../../shared/types";
import { DeckCardSet } from "../deck-card-set";

const prompt1 = new PromptDeckCard('0001', 'Hello, _', 1, 0, 0, 8, 0, ['lol'], 0, 0);
const prompt2 = new PromptDeckCard('0003', 'Bye _ and _', 2, 0, 0, 0, 0, ['wut'], 0, 0);
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