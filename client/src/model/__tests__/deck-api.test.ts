import { expect, test } from 'vitest';
import { Deck, DeckTag, PromptDeckCard, ResponseDeckCard } from '../../shared/types';
import { detectCat, detectDeer, detectLenich, isOnlyEmojis, mergeDecks, parseDeckTsv, parsePromptPick, processCardText, processPromptText } from '../deck-api';

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
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 0, 0, ["lol"], 0, 0),
    new PromptDeckCard("0002", "Bye _ and _", 2, 0, 0, 0, 0, ["wut"], 0, 0),
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
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 0, 0, ["lol"], 0, 0)
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
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 0, 0, ["lol"], 0, 0),
    new PromptDeckCard("0002", "Bye _ and _", 2, 0, 0, 0, 0, ["wut"], 0, 0),
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
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 0, 0, ["lol"], 0, 0),
    new PromptDeckCard("0002", "Bye _ and _", 2, 0, 0, 0, 0, ["wut"], 0, 0),
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

//TODO: add test for custom-formatted IDs
test('merge decks', async () => {
  const deck1 = parseDeckTsv("test1", "Test 1",
    `Type\tText\tTags...
Prompt\tHello, __\tlol\t\t\t
Response\tPoop`,
    `lol\tFirst tag`);
  deck1.prompts[0].plays = 8;
  deck1.responses[0].plays = 9;

  const deck2 = parseDeckTsv("test2", "Test 2",
    `Type\tText\tTags...
Prompt\tBye __ and _\t\twut
Response\tWhat`,
    `wut
lol\tDuplicate tag`);

  const merged = await mergeDecks(deck1, deck2);

  const expected = new Deck("test1", "Test 1");
  expected.prompts = [
    new PromptDeckCard("0001", "Hello, _", 1, 0, 0, 8, 0, ["lol"], 0, 0),
    new PromptDeckCard("0003", "Bye _ and _", 2, 0, 0, 0, 0, ["wut"], 0, 0),
  ];
  expected.responses = [
    new ResponseDeckCard("0002", "Poop", 0, 0, 9, 0, 0, 0, []),
    new ResponseDeckCard("0004", "What", 0, 0, 0, 0, 0, 0, []),
  ];
  expected.tags = [
    new DeckTag("lol", "Duplicate tag"),
    new DeckTag("wut"),
  ];
  expect(merged).toEqual(expected);
});

test('detect special words', () => {
  expect(detectDeer("кот это не олн")).toBe(false);
  expect(detectDeer("🦌🦌🦌")).toBe(true);
  expect(detectDeer("олень пришел")).toBe(true);
  expect(detectDeer("Большой Олень")).toBe(true);
  expect(detectDeer("кто-то оленеподобный")).toBe(true);
  expect(detectDeer("арви пришел")).toBe(true);
  expect(detectDeer("похож на арвинуса")).toBe(true);
  expect(detectLenich("денис")).toBe(false);
  expect(detectLenich("ленич")).toBe(true);
  expect(detectLenich("Леонид")).toBe(true);
  expect(detectLenich("брат ленича")).toBe(true);
  expect(detectCat("ленич")).toBe(false);
  expect(detectCat("Кот")).toBe(true);
  expect(detectCat("Котик")).toBe(true);
  expect(detectCat("Кошка")).toBe(true);
  expect(detectCat("Кошька")).toBe(true);
  expect(detectCat("Лучшая Кошкодевочка")).toBe(true);
  expect(detectCat("Кошка-жена")).toBe(true);
  expect(detectCat("Котовник")).toBe(false);
});

test('detect only-emoji strings', () => {
  expect(isOnlyEmojis("abc🙂")).toBe(false);
  expect(isOnlyEmojis("🙂")).toBe(true);
  expect(isOnlyEmojis("🙂🙂🙂 🙂\n 🙂")).toBe(true);
  expect(isOnlyEmojis("🦌")).toBe(true);
});