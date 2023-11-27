import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { Deck, GameLobby, PlayerInLobby } from "./types";

export const lobbyConverter: FirestoreDataConverter<GameLobby> = {
    toFirestore: (lobby: GameLobby) => {
        return {
            lobby_key: lobby.lobby_key,
            time_created: Timestamp.fromDate(lobby.time_created),
            players: lobby.players,
        }
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot) => {
        const data = snapshot.data();
        const time_created = data.time_created as Timestamp;
        const ret = new GameLobby(data.lobby_key, time_created.toDate());
        const players = (data.players as Array<any>).map(
            (p) => new PlayerInLobby(p.name, p.spectator_status)
        );
        ret.players = players;
        return ret;
    }
}

export const deckConverter: FirestoreDataConverter<Deck> = {
    toFirestore: (deck: Deck) => deck,
    fromFirestore: (snapshot: QueryDocumentSnapshot) => {
        const data = snapshot.data();
        const ret = new Deck(data.name);
        ret.answers = data.answers || [];
        ret.questions = data.questions || [];
        return ret;
    }
}