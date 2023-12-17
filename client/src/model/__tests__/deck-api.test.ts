import { expect, test } from 'vitest';
import { parsePromptPick, processCardText, processPromptText } from '../deck-api';

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
});

test('process card text', () => {
  expect(processCardText("line one\\nline two")).toBe("line one\nline two");
});

test('process prompt text', () => {
  expect(processPromptText("__ uneven _ gaps ____"))
    .toBe("_ uneven _ gaps _");
  expect(processPromptText("respect _markdown_, _!"))
    .toBe("respect _markdown_, _!");
  expect(processPromptText("punctuation, _, is important _. Right _? _: yes _; _"))
    .toBe("punctuation, _, is important _. Right _? _: yes _; _");
});