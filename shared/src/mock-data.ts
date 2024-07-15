import { PromptDeckCard, ResponseCardInGame, ResponseDeckCard } from './types';

export function newPromptCard(id: string = '01') {
  return new PromptDeckCard(id, 'My prompt', 1, 0, 0, 0, 0, [], 0, 0);
}

export function newResponseCard(id: string = '02') {
  return new ResponseDeckCard(id, 'My response', 0, 0, 0, 0, 0, 0, []);
}

export function newResponseCardInGame(id: string = '03') {
  return new ResponseCardInGame(
    id,
    'my_deck',
    `my_deck_${id}`,
    123,
    'My reponse in game',
    0,
    [],
    undefined,
  );
}

export function newGameHand(length: number = 10) {
  const out = new Array<ResponseCardInGame>(length);
  for (let i = 0; i < length; i++) {
    out[i] = newResponseCardInGame(String(i + 1).padStart(4, '0'));
  }
  return out;
}
