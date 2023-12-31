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
  PlayerDataInTurn,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  PromptDeckCard,
  ResponseCardInGame,
  ResponseDeckCard
} from "./types";
import { copyFields, copyFields2 } from "./utils";

export const lobbyConverter: FConverter<GameLobby> = {
  toFirestore: (lobby: GameLobby) => {
    return {
      status: lobby.status,
      creator_uid: lobby.creator_uid,
      time_created: lobby.time_created ?
        FTimestamp.fromDate(lobby.time_created) :
        fServerTimestamp(), // set new time when creating a new lobby
      deck_ids: Array.from(lobby.deck_ids),
      // the rest of the fields are subcollections, and they
      // should not be uploaded during creation.
    };
  },
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new GameLobby(snapshot.id, data.creator_uid, data.status);
    ret.time_created = (data.time_created as FTimestamp | null)?.toDate();
    ret.deck_ids = new Set<string>(data.deck_ids || []);
    return ret;
  },
};

export const playerConverter: FConverter<PlayerInLobby> = {
  toFirestore: (player: PlayerInLobby) => copyFields2(player, {
    time_joined: player.time_joined ?
      FTimestamp.fromDate(player.time_joined) :
      fServerTimestamp(), // set new time when adding a new player
  }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const ret = new PlayerInLobby(
      data.uid, data.name, data.role, data.status, data.score);
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
    prompt: turn.prompt && copyFields(turn.prompt, []),
  }, ['id', 'player_data', 'player_responses']),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const time_created = data.time_created as FTimestamp | null;
    const prompt = data.prompt && mapPromptCardInGame(data.prompt);
    const ret = new GameTurn(
      snapshot.id,
      data.ordinal,
      data.judge_uid,
      prompt,
      time_created?.toDate(),
    );
    ret.timer_ms = data.timer_ms || 0;
    ret.phase = data.phase || "new";
    ret.winner_uid = data.winner_uid;
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
  }),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    const player_uid = snapshot.id;
    const cards = (data.cards as Array<any>)?.map(mapResponseCardInGame) || [];
    return new PlayerResponse(player_uid, data.player_name, cards,
      data.random_index, data.revealed);
  },
};

function mapPromptCardInGame(data: any): PromptCardInGame {
  return new PromptCardInGame(data.id, data.deck_id, data.card_id_in_deck,
    data.random_index, data.content, data.pick, data.rating, data.downvoted);
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
      data.rating, data.views, data.plays, data.discards, data.tags || []);
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
      data.views, data.plays, data.discards, data.wins, data.tags || []);
    ret.time_created = (data.time_created as FTimestamp | null)?.toDate();
    return ret;
  },
};

export const promptCardInGameConverter: FConverter<PromptCardInGame> = {
  toFirestore: (card: PromptCardInGame) => copyFields(card),
  fromFirestore: (snapshot: FDocSnapshot) => {
    const data = snapshot.data();
    return new PromptCardInGame(snapshot.id, data.deck_id, data.card_id_in_deck,
      data.random_index, data.content, data.pick, data.rating, data.downvoted);
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
