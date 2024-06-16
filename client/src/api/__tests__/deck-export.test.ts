import { expect, test } from 'vitest';
import {
  Deck,
  DeckTag,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../shared/types';
import {
  DeckExportData,
  deserializeDecks,
  serializeDeckForExport,
} from '../deck-export';

test('export deck', () => {
  const deck = new Deck('my_deck', 'My deck');
  deck.prompts = [
    new PromptDeckCard('0001', 'Hello, _', 1, 10, 0, 0, 0, ['lol'], 0, 0),
    new PromptDeckCard('0002', 'Bye _ and _', 2, 0, 3, 0, 0, ['wut'], 0, 0),
  ];
  deck.responses = [new ResponseDeckCard('0003', 'Poop', 0, 0, 4, 0, 0, 0, [])];
  deck.tags = [new DeckTag('lol'), new DeckTag('wut')];

  const deckNoTags = new Deck('no_tags', 'No tags');
  deckNoTags.responses = [
    new ResponseDeckCard('0001', 'Woah', 0, 0, 0, 5, 0, 0, []),
  ];

  const data: DeckExportData = {
    version: 1,
    date_created: 'some_date',
    decks: [deck, deckNoTags],
  };
  const json = serializeDeckForExport(data);

  expect(json).toBe(`{
  "version": 1,
  "date_created": "some_date",
  "decks": [
    {
      "prompts": [
        {
          "id": "0001",
          "content": "Hello, _",
          "pick": 1,
          "rating": 10,
          "tags": [
            "lol"
          ]
        },
        {
          "id": "0002",
          "content": "Bye _ and _",
          "pick": 2,
          "views": 3,
          "tags": [
            "wut"
          ]
        }
      ],
      "responses": [
        {
          "id": "0003",
          "content": "Poop",
          "plays": 4
        }
      ],
      "tags": [
        {
          "name": "lol"
        },
        {
          "name": "wut"
        }
      ],
      "id": "my_deck",
      "title": "My deck"
    },
    {
      "responses": [
        {
          "id": "0001",
          "content": "Woah",
          "discards": 5
        }
      ],
      "id": "no_tags",
      "title": "No tags"
    }
  ]
}`);

  // Deserialize back:
  const [reDeck1, reDeck2] = deserializeDecks(json);
  expect(reDeck1).toEqual(deck);
  expect(reDeck2).toEqual(deckNoTags);
});
