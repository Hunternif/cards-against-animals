import { copyFields2 } from '../../shared/utils';
import { PromptDeckCard, ResponseDeckCard, defaultLobbySettings } from '../../shared/types';
import { getCardIndex } from '../deck-server-api';

test('update card index to put new cards first', () => {
  const fakeRng = {
    randomInt() {
      return 2012345678;
    }
  };
  const unplayedCard = new PromptDeckCard("01", "Unplayed prompt", 1, 0, 0, 0, 0, []);
  const playedCard = new ResponseDeckCard("02", "Played response", 0, 0, 99, 0, 0, []);

  const settingsNoReorder = copyFields2(defaultLobbySettings, {
    new_cards_first: false,
    sort_cards_by_rating: false,
  });

  expect(getCardIndex(unplayedCard, fakeRng, settingsNoReorder)).toBe(2012345678);
  expect(getCardIndex(playedCard, fakeRng, settingsNoReorder)).toBe(2012345678);

  const settingsReorder = copyFields2(defaultLobbySettings, {
    new_cards_first: true,
    sort_cards_by_rating: false,
  });
  expect(getCardIndex(unplayedCard, fakeRng, settingsReorder)).toBe(2012345678);
  expect(getCardIndex(playedCard, fakeRng, settingsReorder)).toBe(12345678);
});