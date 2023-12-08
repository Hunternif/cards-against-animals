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
  PromptCardInTurn,
  PromptDeckCard,
  ResponseCardInHand,
  ResponseDeckCard
} from "../shared/types";

export const lobbyConverter: FirestoreDataConverter<GameLobby> = {
  toFirestore: (lobby: GameLobby) => {
    return {
      id: lobby.id,
      lobby_key: lobby.lobby_key,
      status: lobby.status,
      player_uids: lobby.player_uids,
      creator_uid: lobby.creator_uid,
      time_created: lobby.time_created ?
        Timestamp.fromDate(lobby.time_created) :
        serverTimestamp(), // set new time when creating a new lobby
      // the rest of the fields are subcollections, and they
      // should not be uploaded during creation.
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    const ret = new GameLobby(
      snapshot.id, data.lobby_key, data.creator_uid, data.status);
    ret.time_created = (data.time_created as Timestamp).toDate();
    ret.player_uids = data.player_uids || [];
    return ret;
  },
};

export const playerConverter: FirestoreDataConverter<PlayerInLobby> = {
  toFirestore: (player: PlayerInLobby) => Object.assign({}, player),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new PlayerInLobby(data.uid, data.name, data.role);
  },
};

export const deckConverter: FirestoreDataConverter<Deck> = {
  toFirestore: (deck: Deck) => {
    return {
      id: deck.id,
      title: deck.title,
    }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    const ret = new Deck(snapshot.id, data.title);
    // all cards must be fetched separately as a subcollection
    return ret;
  },
};

export const turnConverter: FirestoreDataConverter<GameTurn> = {
  toFirestore: (turn: GameTurn) => Object.assign({}, turn, {
    time_created: Timestamp.fromDate(turn.time_created),
    prompt: Object.assign({}, turn.prompt),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    const time_created = data.time_created as Timestamp;
    const prompt = new PromptCardInTurn(
      data.prompt.deck_id,
      data.prompt.card_id,
      data.prompt.content,
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
  toFirestore: (pdata: PlayerDataInTurn) => Object.assign({}, pdata, {
    hand: pdata.hand.map((card) => Object.assign({}, card)),
    current_play: pdata.current_play.map((card) => Object.assign({}, card)),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    const player_uid = snapshot.id;
    const ret = new PlayerDataInTurn(player_uid, data.player_name);
    ret.hand = (data.hand as Array<any>)
      ?.map(mapResponseCardInHand) || [];
    ret.current_play = (data.current_play as Array<any>)
      ?.map(mapResponseCardInHand) || [];
    return ret;
  },
};

function mapResponseCardInHand(data: any): ResponseCardInHand {
  return new ResponseCardInHand(data.deck_id, data.card_id, data.content);
}

export const userConverter: FirestoreDataConverter<CAAUser> = {
  toFirestore: (user: CAAUser) => Object.assign({}, user),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new CAAUser(data.uid, data.name, data.email, data.is_admin ?? false);
  },
};

export const promptDeckCardConverter: FirestoreDataConverter<PromptDeckCard> = {
  toFirestore: (card: PromptDeckCard) => Object.assign({}, card),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new PromptDeckCard(data.id, data.content, data.rating);
  },
};

export const responseDeckCardConverter: FirestoreDataConverter<ResponseDeckCard> = {
  toFirestore: (card: ResponseDeckCard) => Object.assign({}, card),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return new ResponseDeckCard(data.id, data.content, data.rating);
  },
};