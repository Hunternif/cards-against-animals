import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import {
  CAAUser,
  Deck,
  GameLobby,
  GameTurn,
  PlayerDataInTurn,
  PlayerInLobby,
  PromptCardInGame,
  PromptDeckCard,
  ResponseCardInGame,
  ResponseDeckCard
} from "../shared/types";
import { copyFields, copyFields2 } from "../shared/utils";

export const lobbyConverter: FirestoreDataConverter<GameLobby> = {
  toFirestore: (lobby: GameLobby) => {
    return {
      lobby_key: lobby.lobby_key,
      status: lobby.status,
      creator_uid: lobby.creator_uid,
      time_created: lobby.time_created ?
        Timestamp.fromDate(lobby.time_created) :
        serverTimestamp(), // set new time when creating a new lobby
      deck_ids: Array.from(lobby.deck_ids),
      // the rest of the fields are subcollections, and they
      // should not be uploaded during creation.
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    const ret = new GameLobby(
      snapshot.id, data.lobby_key, data.creator_uid, data.status);
    ret.time_created = (data.time_created as Timestamp).toDate();
    ret.deck_ids = new Set<string>(data.deck_ids || []);
    return ret;
  },
};

export const playerConverter: FirestoreDataConverter<PlayerInLobby> = {
  toFirestore: (player: PlayerInLobby) => copyFields(player),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new PlayerInLobby(data.uid, data.name, data.role);
  },
};

export const deckConverter: FirestoreDataConverter<Deck> = {
  toFirestore: (deck: Deck) => {
    return {
      title: deck.title,
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    const ret = new Deck(snapshot.id, data.title);
    // all cards must be fetched separately as a subcollection
    return ret;
  },
};

export const turnConverter: FirestoreDataConverter<GameTurn> = {
  toFirestore: (turn: GameTurn) => copyFields2(turn, {
    time_created: Timestamp.fromDate(turn.time_created),
    prompt: copyFields(turn.prompt, []),
  }, ['id', 'player_data']),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    const time_created = data.time_created as Timestamp;
    const prompt = new PromptCardInGame(
      data.prompt.id,
      data.prompt.deck_id,
      data.prompt.card_id,
      data.prompt.random_index,
      data.prompt.content,
      data.prompt.rating,
    );
    const ret = new GameTurn(
      snapshot.id,
      data.judge_uid,
      prompt,
      time_created.toDate(),
    );
    ret.timer_ms = data.timer_ms || 0;
    ret.phase = data.phase || "new";
    ret.winner_uid = data.winner_uid;
    return ret;
  },
};

export const playerDataConverter: FirestoreDataConverter<PlayerDataInTurn> = {
  toFirestore: (pdata: PlayerDataInTurn) => copyFields2(pdata, {
    hand: pdata.hand.map((card) => copyFields(card, [])),
    current_play: pdata.current_play.map((card) => copyFields(card, [])),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    const player_uid = snapshot.id;
    const ret = new PlayerDataInTurn(player_uid, data.player_name);
    ret.hand = (data.hand as Array<any>)
      ?.map(mapResponseCardInGame) || [];
    ret.current_play = (data.current_play as Array<any>)
      ?.map(mapResponseCardInGame) || [];
    return ret;
  },
};

function mapResponseCardInGame(data: any): ResponseCardInGame {
  return new ResponseCardInGame(data.id, data.deck_id, data.card_id,
    data.random_index, data.content, data.rating);
}

export const userConverter: FirestoreDataConverter<CAAUser> = {
  toFirestore: (user: CAAUser) => copyFields(user),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new CAAUser(data.uid, data.name, data.email, data.is_admin ?? false,
      data.current_lobby_id);
  },
};

export const promptDeckCardConverter: FirestoreDataConverter<PromptDeckCard> = {
  toFirestore: (card: PromptDeckCard) => copyFields(card),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new PromptDeckCard(data.id, data.content, data.rating);
  },
};

export const responseDeckCardConverter: FirestoreDataConverter<ResponseDeckCard> = {
  toFirestore: (card: ResponseDeckCard) => copyFields(card),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new ResponseDeckCard(data.id, data.content, data.rating);
  },
};

export const promptCardInGameConverter: FirestoreDataConverter<PromptCardInGame> = {
  toFirestore: (card: PromptCardInGame) => copyFields(card),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new PromptCardInGame(snapshot.id, data.deck_id, data.card_id,
      data.random_index, data.content, data.rating);
  },
};

export const responseCardInGameConverter: FirestoreDataConverter<ResponseCardInGame> = {
  toFirestore: (card: ResponseCardInGame) => copyFields(card),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new ResponseCardInGame(snapshot.id, data.deck_id, data.card_id,
      data.random_index, data.content, data.rating);
  },
};
