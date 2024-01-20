import { expect, test } from 'vitest';
import { detectDeer, detectLenich, parseDeckTsv, parsePromptPick, processCardText, processPromptText } from '../deck-api';
import { Deck, DeckTag, PromptDeckCard, ResponseDeckCard } from '../../shared/types';

test('parse pick from prompt text', () => {
  expect(parsePromptPick("No gaps!")).toBe(1);
  expect(parsePromptPick("One gap: __")).toBe(1);
  expect(parsePromptPick("Two gaps: __ and __")).toBe(2);
  expect(parsePromptPick("__ - three! _, _.")).toBe(3);
  expect(parsePromptPick("__ begins")).toBe(1);
  expect(parsePromptPick("Punctuation: __! __... _")).toBe(3);
  expect(parsePromptPick("Bad punctuation: this _- is bad _~")).toBe(2);
  expect(parsePromptPick("Variable gap: _ but ____")).toBe(2);
  expect(parsePromptPick("Markdown: how _about_ *this* _? _...")).toBe(2);
  expect(parsePromptPick("Broken markdown: my _special _ is _")).toBe(2);
  expect(parsePromptPick("Quotes: _ in my band \"__\"")).toBe(2);
  expect(parsePromptPick("Quotes 2: _ in my band «__»")).toBe(2);
  expect(parsePromptPick("Quotes 3: book «\"_\" или _»")).toBe(2);
});

test('process card text', () => {
  expect(processCardText("line one\\nline two")).toBe("line one\nline two");
  expect(processCardText("line one\\nline two\\nline three")).toBe("line one\nline two\nline three");
});

test('process prompt text', () => {
  expect(processPromptText("__ uneven _ gaps ____"))
    .toBe("_ uneven _ gaps _");
  expect(processPromptText("respect _markdown_, _!"))
    .toBe("respect _markdown_, _!");
  expect(processPromptText("punctuation, _, is important _. Right _? _: yes _; _"))
    .toBe("punctuation, _, is important _. Right _? _: yes _; _");
  expect(processPromptText("Quotes: _ in my band \"__\""))
    .toBe("Quotes: _ in my band \"_\"");
  expect(processPromptText("Quotes 2: _ in my band «__»"))
    .toBe("Quotes 2: _ in my band «_»");
  expect(processPromptText("Quotes 3: book «\"__\" или __»"))
    .toBe("Quotes 3: book «\"_\" или _»");
});

test('parse TSV deck', () => {
  const deck = parseDeckTsv("my_deck", "My deck",
    `Type\tText\tTags...
Prompt\tHello, __\tlol\t\t\t
Prompt\tBye __ and _\t\twut
Response\tPoop`,
    `Tag\tDescription
lol\tFirst tag
wut\tSecond tag`);
  const expected = new Deck("my_deck", "My deck");
  expected.prompts = [
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 0, 0, ["lol"]),
    new PromptDeckCard("0002", "Bye _ and _", 2, 0, 0, 0, 0, ["wut"]),
  ];
  expected.responses = [
    new ResponseDeckCard("0003", "Poop", 0, 0, 0, 0, 0, 0, []),
  ];
  expected.tags = [
    new DeckTag("lol", "First tag"),
    new DeckTag("wut", "Second tag"),
  ];
  expect(deck).toEqual(expected);
  expect(deck.title).toBe("My deck");
  expect(deck.prompts.length).toBe(2);
  expect(deck.prompts[0]).toEqual(
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 0, 0, ["lol"])
  );
});

test('parse TSV deck without tag descriptions', () => {
  const deck = parseDeckTsv("my_deck", "My deck",
    `Type\tText\tTags...
Prompt\tHello, __\tlol\t\t\t
Prompt\tBye __ and _\t\twut
Response\tPoop`, "");
  const expected = new Deck("my_deck", "My deck");
  expected.prompts = [
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 0, 0, ["lol"]),
    new PromptDeckCard("0002", "Bye _ and _", 2, 0, 0, 0, 0, ["wut"]),
  ];
  expected.responses = [
    new ResponseDeckCard("0003", "Poop", 0, 0, 0, 0, 0, 0, []),
  ];
  expected.tags = [
    new DeckTag("lol"),
    new DeckTag("wut"),
  ];
  expect(deck).toEqual(expected);
});

test('parse TSV deck without mixed tags', () => {
  const deck = parseDeckTsv("my_deck", "My deck",
    `Type\tText\tTags...
Prompt\tHello, __\tlol\t\t\t
Prompt\tBye __ and _\t\twut
Response\tPoop`,
    `lol\tFirst tag
lol\tDuplicate tag`);
  const expected = new Deck("my_deck", "My deck");
  expected.prompts = [
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 0, 0, ["lol"]),
    new PromptDeckCard("0002", "Bye _ and _", 2, 0, 0, 0, 0, ["wut"]),
  ];
  expected.responses = [
    new ResponseDeckCard("0003", "Poop", 0, 0, 0, 0, 0, 0, []),
  ];
  expected.tags = [
    new DeckTag("lol", "Duplicate tag"),
    new DeckTag("wut"),
  ];
  expect(deck).toEqual(expected);
});

test('detect special words', () => {
  expect(detectDeer("кот это не олн")).toBe(false);
  expect(detectDeer("🦌🦌🦌")).toBe(true);
  expect(detectDeer("олень пришел")).toBe(true);
  expect(detectDeer("кто-то оленеподобный")).toBe(true);
  expect(detectDeer("арви пришел")).toBe(true);
  expect(detectDeer("похож на арвинуса")).toBe(true);
  expect(detectLenich("денис")).toBe(false);
  expect(detectLenich("ленич")).toBe(true);
  expect(detectLenich("брат ленича")).toBe(true);
});