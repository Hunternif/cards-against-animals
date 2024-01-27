import { copyFields2 } from "../../shared/utils";
import { PromptDeckCard, ResponseDeckCard, defaultLobbySettings } from "../../shared/types";
import { getCardIndex } from "../deck-server-api";

test('update card index to put new cards first', () => {
  const fakeRng = {
    randomInt() {
      return 2012345678;
    }
  };
  const unviewedCard = newPromptCard();
  const viewedCard = copyFields2(newResponseCard(), { views: 99 });

  const settingsNoReorder = copyFields2(defaultLobbySettings(), {
    new_cards_first: false,
    sort_cards_by_rating: false,
  });

  expect(getCardIndex(unviewedCard, fakeRng, settingsNoReorder)).toBe(2012345678);
  expect(getCardIndex(viewedCard, fakeRng, settingsNoReorder)).toBe(2012345678);

  const settingsReorder = copyFields2(defaultLobbySettings(), {
    new_cards_first: true,
    sort_cards_by_rating: false,
  });
  expect(getCardIndex(unviewedCard, fakeRng, settingsReorder)).toBe(2012345678);
  expect(getCardIndex(viewedCard, fakeRng, settingsReorder)).toBe(12345678);
});


test('sort cards based on rating', () => {
  const fakeRng = {
    randomInt() {
      return 100;
    }
  };
  const settings = copyFields2(defaultLobbySettings(), {
    new_cards_first: false,
    sort_cards_by_rating: true,
  });

  // For new cards, index is unchanged:
  expect(getCardIndex(newPromptCard(), fakeRng, settings)).toBe(100);
  expect(getCardIndex(newResponseCard(), fakeRng, settings)).toBe(100);

  const card = newResponseCard();
  // Views with no plays decrease index (reduces probability):
  card.views = 1;
  expect(getCardIndex(card, fakeRng, settings)).toBe(90);
  card.views = 2;
  expect(getCardIndex(card, fakeRng, settings)).toBe(83);
  card.views = 10;
  expect(getCardIndex(card, fakeRng, settings)).toBe(50);
  card.views = 15;
  expect(getCardIndex(card, fakeRng, settings)).toBe(40);
  card.views = 40;
  expect(getCardIndex(card, fakeRng, settings)).toBe(20);

  // Plays don't change index:
  card.views = 40;
  card.plays = 1;
  expect(getCardIndex(card, fakeRng, settings)).toBe(20);
  card.plays = 2;
  expect(getCardIndex(card, fakeRng, settings)).toBe(20);

  // Wins boost index (increases probability):
  card.views = 40;
  card.plays = 1;
  card.wins = 1;
  expect(getCardIndex(card, fakeRng, settings)).toBe(40);
  card.plays = 2;
  card.wins = 2;
  expect(getCardIndex(card, fakeRng, settings)).toBe(60);
  card.plays = 5;
  card.wins = 5;
  expect(getCardIndex(card, fakeRng, settings)).toBe(120);
  card.plays = 6;
  card.wins = 6;
  // Capped at 1.2x:
  expect(getCardIndex(card, fakeRng, settings)).toBe(120);
  card.plays = 0;
  card.wins = 0;

  // Discards trash index:
  card.views = 1;
  card.discards = 1;
  expect(getCardIndex(card, fakeRng, settings)).toBe(8);
  card.views = 2;
  card.discards = 2;
  expect(getCardIndex(card, fakeRng, settings)).toBe(3);
  card.discards = 0;

  // Card rating (downvotes) reduce index:
  card.views = 10;
  card.rating = 0;
  expect(getCardIndex(card, fakeRng, settings)).toBe(50);
  card.rating = -1;
  expect(getCardIndex(card, fakeRng, settings)).toBe(30);
  card.rating = -2;
  expect(getCardIndex(card, fakeRng, settings)).toBe(10);
  card.rating = -3;
  expect(getCardIndex(card, fakeRng, settings)).toBe(0);
  // Capped at x0:
  card.rating = -4;
  expect(getCardIndex(card, fakeRng, settings)).toBe(0);
  card.rating = 0;

  // Likes from responses increase index:
  card.views = 40;
  card.plays = 1;
  expect(getCardIndex(card, fakeRng, settings)).toBe(20);
  card.likes = 1;
  expect(getCardIndex(card, fakeRng, settings)).toBe(30);
  card.likes = 2;
  expect(getCardIndex(card, fakeRng, settings)).toBe(40);
  card.likes = 4;
  expect(getCardIndex(card, fakeRng, settings)).toBe(60);
  card.likes = 6;
  expect(getCardIndex(card, fakeRng, settings)).toBe(80);
  card.likes = 0;

  // For prompts, views are less frequent:
  const prompt = newPromptCard();
  // Played 1 time:
  prompt.views = 1;
  prompt.plays = 1;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(90);
  // Skipped 1 time:
  prompt.views = 1;
  prompt.plays = 0;
  prompt.discards = 1;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(8);
  // Played 1 time and skipped 1 time:
  prompt.views = 2;
  prompt.plays = 1;
  prompt.discards = 1;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(7);
  // Played 2 times and skipped 1 time:
  prompt.views = 3;
  prompt.plays = 2;
  prompt.discards = 1;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(6);
  prompt.plays = 0;
  prompt.discards = 0;

  // Prompt upvotes increase index:
  prompt.views = 2;
  prompt.plays = 1;
  prompt.discards = 1;
  prompt.upvotes = 1;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(22);
  prompt.upvotes = 2;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(37);
  prompt.upvotes = 0;

  // Prompt downvotes decrease index:
  prompt.views = 1;
  prompt.discards = 0;
  prompt.plays = 1;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(90);
  prompt.downvotes = 1;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(8);
  prompt.downvotes = 2;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(4);
  prompt.downvotes = 3;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(2);
  prompt.downvotes = 4;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(2);
  prompt.downvotes = 5;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(1);
  prompt.downvotes = 6;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(1);
  prompt.views = 2;
  prompt.plays = 2;
  prompt.downvotes = 5;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(1);

  // Prompt upvotes and downvotes cancel each other out:
  prompt.views = 1;
  prompt.plays = 1;
  prompt.upvotes = 10;
  prompt.downvotes = 10;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(90);
  prompt.downvotes = 11;
  expect(getCardIndex(prompt, fakeRng, settings)).toBe(8);
});

function newPromptCard() {
  return new PromptDeckCard("01", "My prompt", 1, 0, 0, 0, 0, [], 0, 0);
}
function newResponseCard() {
  return new ResponseDeckCard("02", "My response", 0, 0, 0, 0, 0, 0, []);
}