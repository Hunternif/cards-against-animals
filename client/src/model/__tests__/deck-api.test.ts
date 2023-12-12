import { expect, test } from 'vitest';
import { parsePromptPick, processCardText, processPromptText } from '../deck-api';

test('parse pick from prompt text', () => {
  expect(parsePromptPick("No gaps!")).toBe(1);
  expect(parsePromptPick("One gap: __")).toBe(1);
  expect(parsePromptPick("Two gaps: __ and __")).toBe(2);
  expect(parsePromptPick("__ - three! __, __.")).toBe(3);
  expect(parsePromptPick("__ begins")).toBe(1);
  expect(parsePromptPick("Punctuation: __! __... _")).toBe(3);
  expect(parsePromptPick("variable length: _ but ____")).toBe(2);
  expect(parsePromptPick("Markdown: how _about_ *this* _?")).toBe(1);
  expect(parsePromptPick("Broken markdown: my _special is _")).toBe(1);
});

test('process card text', () => {
  expect(processCardText("line one\\nline two")).toBe("line one\nline two");
});

test('process prompt text', () => {
  expect(processPromptText("__ uneven _ gaps ____"))
    .toBe("___ uneven ___ gaps ___");
  expect(processPromptText("respect _markdown_, _!"))
    .toBe("respect _markdown_, ___!");
  expect(processPromptText("punctuation, _, is important _. Right _? _: yes _; _"))
    .toBe("punctuation, ___, is important ___. Right ___? ___: yes ___; ___");
});