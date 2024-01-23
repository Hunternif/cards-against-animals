import {
  FConverter,
  FDocSnapshot,
  FTimestamp,
  fServerTimestamp
} from "../firestore-adapter";
import {
  CAAUser,
  Deck,
  DeckTag,
  GameLobby,
  GameTurn,
  LobbySettings,
  PlayerDataInTurn,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  PromptDeckCard,
  ResponseCardInGame,
  ResponseDeckCard,
  Vote,
  defaultLobbySettings
} from "./types";
import { copyFields, copyFields2, removeUndefined } from "./utils";

export const lobbyConverter: FConverter<GameLobby> = {
  toFirestore: (lobby: GameLobby) => {
    return {
      status: lobby.status,
      creator_uid: lobby.creator_uid,
      time_created: lobby.time_created ?
        FTimestamp.fromDate(lobby.time_created) :
        fServerTimestamp(), // set new time when creating a new lobby
      deck_ids: Array.from(lobby.deck_ids),
      settings: copyFields(lobby.settings),
      // the rest of the fields are subcollections, and they
      // should not be uploaded during creation.
    };
  },
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const settings: LobbySettings = data.settings ?
      mapSettings(data.settings) : defaultLobbySettings();
    const ret = new GameLobby(snapshot.id, data.creator_uid, settings, data.status);
    ret.time_created = (data.time_created as FTimestamp | null)?.toDate();
    ret.deck_ids = new Set<string>(data.deck_ids || []);
    return ret;
  },
};

function mapSettings(data: any): LobbySettings {
  const readSettings: LobbySettings = {
    play_until: data.play_until,
    max_turns: data.max_turns,
    max_score: data.max_score,
    turns_per_person: data.turns_per_person,
    cards_per_person: data.cards_per_person,
    new_cards_first: data.new_cards_first,
    sort_cards_by_rating: data.sort_cards_by_rating,
    allow_join_mid_game: data.allow_join_mid_game,
    enable_likes: data.enable_likes,
    freeze_stats: data.freeze_stats,
    show_likes_to: data.show_likes_to,
  };
  return copyFields2(defaultLobbySettings(), removeUndefined(readSettings));
}

export const playerConverter: FConverter<PlayerInLobby> = {
  toFirestore: (player: PlayerInLobby) => copyFields2(player, {
    time_joined: player.time_joined ?
      FTimestamp.fromDate(player.time_joined) :
      fServerTimestamp(), // set new time when adding a new player
  }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new PlayerInLobby(
      data.uid, data.name, data.random_index ?? 0, data.role, data.status,
      data.score ?? 0, data.likes ?? 0);
    ret.time_joined = (data.time_joined as FTimestamp | null)?.toDate();
    return ret;
  },
};

export const deckConverter: FConverter<Deck> = {
  toFirestore: (deck: Deck) => {
    return {
      title: deck.title,
    };
  },
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new Deck(snapshot.id, data.title);
    // all cards must be fetched separately as a subcollection
    return ret;
  },
};

export const deckTagConverter: FConverter<DeckTag> = {
  toFirestore: (tag: DeckTag) => copyFields(tag),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new DeckTag(data.name, data.description);
  },
};

export const turnConverter: FConverter<GameTurn> = {
  toFirestore: (turn: GameTurn) => copyFields2(turn, {
    time_created: FTimestamp.fromDate(turn.time_created),
    // if legacy prompt exists, keep it:
    prompt: turn.legacy_prompt && copyFields(turn.legacy_prompt, []),
  }, ['id', 'player_data', 'player_responses', 'legacy_prompt', 'prompts']),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const time_created = data.time_created as FTimestamp | null;
    const ret = new GameTurn(
      snapshot.id,
      data.ordinal,
      data.judge_uid,
      time_created?.toDate(),
    );
    ret.timer_ms = data.timer_ms || 0;
    ret.phase = data.phase || "new";
    ret.winner_uid = data.winner_uid;
    ret.audience_award_uids = data.audience_award_uids ?? [];
    ret.legacy_prompt = data.prompt && mapPromptCardInGame(data.prompt);
    return ret;
  },
};

export const playerDataConverter: FConverter<PlayerDataInTurn> = {
  toFirestore: (pdata: PlayerDataInTurn) => copyFields(pdata, ['hand', 'discarded']),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const player_uid = snapshot.id;
    const ret = new PlayerDataInTurn(player_uid, data.player_name);
    return ret;
  },
};

export const playerResponseConverter: FConverter<PlayerResponse> = {
  toFirestore: (pdata: PlayerResponse) => copyFields2(pdata, {
    cards: pdata.cards.map((card) => copyFields(card, [])),
  }, ["likes"]),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const player_uid = snapshot.id;
    const cards = (data.cards as Array<any>)?.map(mapResponseCardInGame) || [];
    return new PlayerResponse(player_uid, data.player_name, cards,
      data.random_index, data.revealed, data.like_count);
  },
};

export const voteConverter: FConverter<Vote> = {
  toFirestore: (like: Vote) => copyFields(like),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const player_uid = snapshot.id;
    return new Vote(player_uid, data.player_name, data.choice ?? "yes");
  },
};

function mapPromptCardInGame(data: any): PromptCardInGame {
  return new PromptCardInGame(data.id, data.deck_id, data.card_id_in_deck,
    data.random_index, data.content, data.pick, data.rating);
}
function mapResponseCardInGame(data: any): ResponseCardInGame {
  return new ResponseCardInGame(data.id, data.deck_id, data.card_id_in_deck,
    data.random_index, data.content, data.rating, data.downvoted);
}

export const userConverter: FConverter<CAAUser> = {
  toFirestore: (user: CAAUser) => copyFields(user),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new CAAUser(data.uid, data.name, data.email, data.is_admin ?? false,
      data.current_lobby_id);
  },
};

export const promptDeckCardConverter: FConverter<PromptDeckCard> = {
  toFirestore: (card: PromptDeckCard) => copyFields2(card, {
    time_created: card.time_created ?
      FTimestamp.fromDate(card.time_created) :
      fServerTimestamp(), // set new time when creating a new card
  }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new PromptDeckCard(snapshot.id, data.content, data.pick,
      data.rating, data.views, data.plays, data.discards, data.tags || [],
      data.upvotes, data.downvotes);
    ret.time_created = (data.time_created as FTimestamp | null)?.toDate();
    return ret;
  },
};

export const responseDeckCardConverter: FConverter<ResponseDeckCard> = {
  toFirestore: (card: ResponseDeckCard) => copyFields2(card, {
    time_created: card.time_created ?
      FTimestamp.fromDate(card.time_created) :
      fServerTimestamp(), // set new time when creating a new card
  }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new ResponseDeckCard(snapshot.id, data.content, data.rating,
      data.views, data.plays, data.discards, data.wins, data.likes,
      data.tags || []);
    ret.time_created = (data.time_created as FTimestamp | null)?.toDate();
    return ret;
  },
};

export const promptCardInGameConverter: FConverter<PromptCardInGame> = {
  toFirestore: (card: PromptCardInGame) => copyFields(card),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new PromptCardInGame(snapshot.id, data.deck_id, data.card_id_in_deck,
      data.random_index, data.content, data.pick, data.rating);
  },
};

export const responseCardInGameConverter: FConverter<ResponseCardInGame> = {
  toFirestore: (card: ResponseCardInGame) => copyFields(card),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new ResponseCardInGame(snapshot.id, data.deck_id, data.card_id_in_deck,
      data.random_index, data.content, data.rating, data.downvoted);
  },
};
