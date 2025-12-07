import { anyTagsKey, noTagsKey, ResponseCardInGame } from '@shared/types';
import {
  CardTagRepository,
  fetchCardsForTags,
  sortAndGroupTags,
} from '../lobby-tags-api';

test('sortTagsBySpecificity', () => {
  const tags = [
    'tag1',
    anyTagsKey,
    'tag2',
    'tag1',
    noTagsKey,
    'tag3',
    anyTagsKey,
    'tag1',
  ];
  const expected = [
    {
      tagName: noTagsKey,
      count: 1,
    },
    {
      tagName: 'tag1',
      count: 3,
    },
    {
      tagName: 'tag2',
      count: 1,
    },
    {
      tagName: 'tag3',
      count: 1,
    },
    {
      tagName: anyTagsKey,
      count: 2,
    },
  ];
  expect(sortAndGroupTags(tags)).toEqual(expected);

  expect(sortAndGroupTags(['tag'])).toEqual([{ tagName: 'tag', count: 1 }]);
});

/** A mock repository for testing, decoupled from Firestore. */
class MockCardTagRepo implements CardTagRepository {
  constructor(private data: Array<ResponseCardInGame>) {}
  async query(
    lobbyID: string,
    tagName: string,
    limit: number,
  ): Promise<ResponseCardInGame[]> {
    if (tagName === anyTagsKey) {
      return this.data.slice(0, limit);
    } else if (tagName === noTagsKey) {
      return this.data.filter((c) => c.tags.length === 0).slice(0, limit);
    } else {
      return this.data
        .filter((c) => c.tags.indexOf(tagName) > -1)
        .slice(0, limit);
    }
  }
}

function makeResponse(id: string, tags: string[]): ResponseCardInGame {
  return new ResponseCardInGame(id, 'my_deck', id, 0, 'test', 0, tags);
}

test('fetchCardsForTags', async () => {
  const repo = new MockCardTagRepo([
    makeResponse('01', []),
    makeResponse('02', ['one']),
    makeResponse('03', ['one', 'two']),
    makeResponse('04', []),
    makeResponse('05', ['one', 'two']),
    makeResponse('06', ['two']),
    makeResponse('07', []),
    makeResponse('08', ['two']),
  ]);

  // Make sure the repo works as expected.
  // Query any tag:
  let repoResult = await repo.query('lobby01', anyTagsKey, 5);
  expect(repoResult.map((c) => c.id)).toEqual(['01', '02', '03', '04', '05']);
  let result = await fetchCardsForTags(
    'lobby01',
    [anyTagsKey, anyTagsKey, anyTagsKey, anyTagsKey, anyTagsKey],
    5,
    repo,
  );
  expect(result.map((c) => c.id)).toEqual(['01', '02', '03', '04', '05']);

  // Query no tag:
  repoResult = await repo.query('lobby01', noTagsKey, 3);
  expect(repoResult.map((c) => c.id)).toEqual(['01', '04', '07']);
  result = await fetchCardsForTags(
    'lobby01',
    [noTagsKey, noTagsKey, noTagsKey],
    3,
    repo,
  );
  expect(result.map((c) => c.id)).toEqual(['01', '04', '07']);

  // Pad results with any tags at the end, to match the higher limit:
  repoResult = await repo.query('lobby01', noTagsKey, 5);
  expect(repoResult.map((c) => c.id)).toEqual(['01', '04', '07']);
  result = await fetchCardsForTags(
    'lobby01',
    [noTagsKey, noTagsKey, noTagsKey, noTagsKey, noTagsKey],
    5,
    repo,
  );
  expect(result.map((c) => c.id)).toEqual(['01', '04', '07', '02', '03']);

  // Query tag 'one':
  repoResult = await repo.query('lobby01', 'one', 3);
  expect(repoResult.map((c) => c.id)).toEqual(['02', '03', '05']);
  result = await fetchCardsForTags('lobby01', ['one', 'one', 'one'], 3, repo);
  expect(result.map((c) => c.id)).toEqual(['02', '03', '05']);

  // Query tag 'two':
  repoResult = await repo.query('lobby01', 'two', 3);
  expect(repoResult.map((c) => c.id)).toEqual(['03', '05', '06']);
  result = await fetchCardsForTags('lobby01', ['two', 'two', 'two'], 3, repo);
  expect(result.map((c) => c.id)).toEqual(['03', '05', '06']);

  // Query with overlap: 2x'one', 1x'two':
  result = await fetchCardsForTags('lobby01', ['one', 'one', 'two'], 3, repo);
  expect(result.map((c) => c.id)).toEqual(['02', '03', '05']);

  // Pad with any tag:
  result = await fetchCardsForTags('lobby01', ['one', 'one', 'two'], 5, repo);
  expect(result.map((c) => c.id)).toEqual(['02', '03', '05', '01', '04']);
});
