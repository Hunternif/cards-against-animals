import {
  FConverter,
  FDocSnapshot,
  FTimestamp,
  fServerTimestamp,
} from '@shared/firestore-adapter';
import {
  CAAUser,
  Deck,
  DeckLock,
  DeckMigrationItem,
  DeckTag,
  GameLobby,
  GameTurn,
  LobbySettings,
  PlayerGameState,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  PromptDeckCard,
  ResponseCardInGame,
  ResponseCardInHand,
  ResponseDeckCard,
  SoundEvent,
  TagInGame,
  Vote,
  defaultLobbySettings,
} from './types';
import {
  copyFields,
  copyFields2,
  mapToObject,
  objectToMap,
  removeUndefined,
} from './utils';

export const lobbyConverter: FConverter<GameLobby> = {
  toFirestore: (lobby: GameLobby) => {
    return copyFields2(
      lobby,
      {
        time_created: lobby.time_created
          ? FTimestamp.fromDate(lobby.time_created)
          : fServerTimestamp(), // set new time when creating a new lobby
        deck_ids: Array.from(lobby.deck_ids),
        // Store tags as an array to maintain order:
        response_tags: lobby.orderedTags().map((t) => copyFields(t)),
      },
      [
        'id',
        'deck_prompts',
        'deck_responses',
        'players',
        'turns',
        'orderedTags',
      ],
    );
  },
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const settings: LobbySettings = data.settings
      ? mapSettings(data.settings)
      : defaultLobbySettings();
    const ret = new GameLobby(
      snapshot.id,
      data.creator_uid,
      settings,
      data.status,
    );
    ret.current_turn_id = data.current_turn_id;
    ret.time_created = (data.time_created as FTimestamp | null)?.toDate();
    ret.deck_ids = new Set<string>(data.deck_ids ?? []);
    if (data.response_tags != null && Array.isArray(data.response_tags)) {
      ret.response_tags = new Map(
        data.response_tags.map(mapTagInGame).map((t: TagInGame) => [t.name, t]),
      );
    }

    ret.next_lobby_id = data.next_lobby_id;
    return ret;
  },
};

function mapSettings(data: any): LobbySettings {
  return copyFields2(defaultLobbySettings(), removeUndefined(data));
}

export const playerConverter: FConverter<PlayerInLobby> = {
  toFirestore: (player: PlayerInLobby) =>
    copyFields2(player, {
      time_joined: FTimestamp.fromDate(player.time_joined),
    }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new PlayerInLobby(
      data.uid,
      data.name,
      data.avatar_id,
      data.random_index ?? 0,
      data.role,
      data.status,
      data.is_bot ?? false,
    );
    ret.time_joined =
      (data.time_joined as FTimestamp | null)?.toDate() ?? new Date();
    return ret;
  },
};

export const playerStateConverter: FConverter<PlayerGameState> = {
  toFirestore: (player: PlayerGameState) =>
    copyFields2(player, {
      time_dealt_cards: FTimestamp.fromDate(player.time_dealt_cards),
      hand: mapToObject(player.hand, (c) => copyFields(c, [])),
      discarded: mapToObject(player.discarded, (c) => copyFields(c, [])),
      downvoted: mapToObject(player.downvoted, (c) => copyFields(c, [])),
    }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new PlayerGameState(
      data.uid,
      data.score ?? 0,
      data.wins ?? 0,
      data.likes ?? 0,
      data.discards_used ?? 0,
      data.discard_tokens ?? 0,
    );
    ret.time_dealt_cards =
      (data.time_dealt_cards as FTimestamp | null)?.toDate() ?? new Date();
    // The 'Map' field type is a plain JS object:
    ret.hand = objectToMap(data.hand ?? {}, mapResponseCardInHand);
    ret.discarded = objectToMap(data.discarded ?? {}, mapResponseCardInGame);
    ret.downvoted = objectToMap(data.downvoted ?? {}, mapResponseCardInGame);
    return ret;
  },
};

export const deckConverter: FConverter<Deck> = {
  toFirestore: (deck: Deck) => {
    return copyFields2(
      deck,
      {
        // Map tags by name to prevent duplicates:
        tags: [
          ...new Map(deck.tags.map((t) => [t.name, copyFields(t)])).values(),
        ],
        time_created: deck.time_created
          ? FTimestamp.fromDate(deck.time_created)
          : fServerTimestamp(),
      },
      ['prompts', 'responses'],
    );
  },
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const tags =
      data.tags?.map((t: any) => new DeckTag(t.name, t.description)) ?? [];
    const time_created = (data.time_created as FTimestamp | null)?.toDate();
    // All decks are public by default, unless specified:
    const ret = new Deck(
      snapshot.id,
      data.title,
      data.visibility ?? 'public',
      tags,
      time_created,
    );
    // all cards must be fetched separately as a subcollection
    return ret;
  },
};

export const turnConverter: FConverter<GameTurn> = {
  toFirestore: (turn: GameTurn) =>
    copyFields2(
      turn,
      {
        time_created: FTimestamp.fromDate(turn.time_created),
        phase_start_time: FTimestamp.fromDate(turn.phase_start_time),
        phase_end_time: turn.phase_end_time
          ? FTimestamp.fromDate(turn.phase_end_time)
          : undefined,
        // if legacy prompt exists, keep it:
        prompt: turn.legacy_prompt && copyFields(turn.legacy_prompt, []),
      },
      ['id', 'player_responses', 'legacy_prompt', 'prompts'],
    ),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const time_created =
      (data.time_created as FTimestamp | null)?.toDate() ?? new Date();
    const ret = new GameTurn(
      snapshot.id,
      data.ordinal,
      data.judge_uid,
      time_created,
    );
    ret.phase_start_time =
      (data.phase_start_time as FTimestamp | null)?.toDate() ?? time_created;
    ret.phase_end_time = (data.phase_end_time as FTimestamp | null)?.toDate();
    ret.phase = data.phase || 'new';
    ret.winner_uid = data.winner_uid;
    ret.audience_award_uids = data.audience_award_uids ?? [];
    ret.legacy_prompt = data.prompt && mapPromptCardInGame(data.prompt);
    return ret;
  },
};

export const playerResponseConverter: FConverter<PlayerResponse> = {
  toFirestore: (pdata: PlayerResponse) =>
    copyFields2(
      pdata,
      {
        cards: pdata.cards.map((card) => copyFields(card, [])),
      },
      ['likes'],
    ),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const player_uid = snapshot.id;
    const cards = (data.cards as Array<any>)?.map(mapResponseCardInGame) || [];
    return new PlayerResponse(
      player_uid,
      data.player_name,
      cards,
      data.random_index,
      data.reveal_count ?? 0,
      data.like_count ?? 0,
    );
  },
};

export const voteConverter: FConverter<Vote> = {
  toFirestore: (like: Vote) => copyFields(like),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const player_uid = snapshot.id;
    return new Vote(player_uid, data.player_name, data.choice ?? 'yes');
  },
};

function mapPromptCardInGame(data: any): PromptCardInGame {
  return new PromptCardInGame(
    data.id,
    data.deck_id,
    data.card_id_in_deck,
    data.random_index ?? 0,
    data.content,
    data.pick ?? 1,
    data.rating ?? 0,
    data.tags ?? [],
  );
}
function mapResponseCardInGame(data: any): ResponseCardInGame {
  return new ResponseCardInGame(
    data.id,
    data.deck_id,
    data.card_id_in_deck,
    data.random_index ?? 0,
    data.content,
    data.rating ?? 0,
    data.tags ?? [],
    data.action,
  );
}

function mapResponseCardInHand(data: any): ResponseCardInHand {
  const baseCard = mapResponseCardInGame(data);
  const time_received =
    (data.time_received as FTimestamp | null)?.toDate() ?? new Date();
  return ResponseCardInHand.create(baseCard, time_received);
}

function mapTagInGame(data: any): TagInGame {
  return new TagInGame(
    data.order ?? 0,
    data.name,
    data.card_count,
    data.description,
  );
}

export const userConverter: FConverter<CAAUser> = {
  toFirestore: (user: CAAUser) => copyFields(user),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new CAAUser(
      data.uid,
      data.email,
      data.name,
      data.avatar_id,
      data.is_admin ?? false,
      data.is_bot ?? false,
      data.current_lobby_id,
    );
  },
};

export const promptDeckCardConverter: FConverter<PromptDeckCard> = {
  toFirestore: (card: PromptDeckCard) =>
    copyFields2(
      card,
      {
        time_created: card.time_created
          ? FTimestamp.fromDate(card.time_created)
          : fServerTimestamp(), // set new time when creating a new card
      },
      ['id', 'type'],
    ),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new PromptDeckCard(
      snapshot.id,
      data.content,
      data.pick ?? 1,
      data.rating ?? 0,
      data.views ?? 0,
      data.plays ?? 0,
      data.discards ?? 0,
      data.likes ?? 0,
      data.tags || [],
      data.upvotes ?? 0,
      data.downvotes ?? 0,
      data.tier,
      data.tier_history || [],
      (data.time_created as FTimestamp | null)?.toDate(),
    );
    return ret;
  },
};

export const responseDeckCardConverter: FConverter<ResponseDeckCard> = {
  toFirestore: (card: ResponseDeckCard) =>
    copyFields2(
      card,
      {
        time_created: card.time_created
          ? FTimestamp.fromDate(card.time_created)
          : fServerTimestamp(), // set new time when creating a new card
      },
      ['id', 'type'],
    ),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new ResponseDeckCard(
      snapshot.id,
      data.content,
      data.rating ?? 0,
      data.views ?? 0,
      data.plays ?? 0,
      data.discards ?? 0,
      data.wins ?? 0,
      data.likes ?? 0,
      data.tags || [],
      data.tier,
      data.tier_history || [],
      (data.time_created as FTimestamp | null)?.toDate(),
      data.action,
    );
    return ret;
  },
};

export const promptCardInGameConverter: FConverter<PromptCardInGame> = {
  toFirestore: (card: PromptCardInGame) => copyFields(card, ['type']),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new PromptCardInGame(
      snapshot.id,
      data.deck_id,
      data.card_id_in_deck,
      data.random_index ?? 0,
      data.content,
      data.pick ?? 1,
      data.rating ?? 0,
      data.tags ?? [],
    );
  },
};

export const responseCardInGameConverter: FConverter<ResponseCardInGame> = {
  toFirestore: (card: ResponseCardInGame) => copyFields(card, ['type']),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new ResponseCardInGame(
      snapshot.id,
      data.deck_id,
      data.card_id_in_deck,
      data.random_index ?? 0,
      data.content,
      data.rating ?? 0,
      data.tags ?? [],
      data.action,
    );
  },
};

export const responseCardInHandConverter: FConverter<ResponseCardInHand> = {
  toFirestore: (card: ResponseCardInHand) =>
    copyFields2(
      card,
      {
        time_received: FTimestamp.fromDate(card.time_received),
      },
      ['type'],
    ),
  fromFirestore: (snapshot: FDocSnapshot) => {
    return mapResponseCardInHand(snapshot.data());
  },
};

export const deckMigrationConverter: FConverter<DeckMigrationItem> = {
  toFirestore: (row: DeckMigrationItem) =>
    copyFields2(row, {
      time_created: row.time_created
        ? FTimestamp.fromDate(row.time_created)
        : fServerTimestamp(),
    }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const time_created = (data.time_created as FTimestamp | null)?.toDate();
    return new DeckMigrationItem(
      data.old_card_unique_id,
      data.new_card_unique_id,
      data.type,
      data.old_deck_id,
      data.old_card_id,
      data.new_deck_id,
      data.new_card_id,
      time_created,
    );
  },
};

export const soundEventConverter: FConverter<SoundEvent> = {
  toFirestore: (event: SoundEvent) =>
    copyFields2(event, {
      time:
        event.time.getTime() > 0
          ? FTimestamp.fromDate(event.time)
          : fServerTimestamp(),
    }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new SoundEvent(
      data.player_uid,
      data.player_name,
      data.sound_id,
      (data.time as FTimestamp | null)?.toDate(),
    );
  },
};

export const deckLockConverter: FConverter<DeckLock> = {
  toFirestore: (lock: DeckLock) => copyFields(lock, ['id']),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new DeckLock(data.deck_id, data.hash);
  },
};
