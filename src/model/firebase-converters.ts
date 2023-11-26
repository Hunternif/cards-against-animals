import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { GameLobby, PlayerInLobby } from "./types";

export const lobbyConverter: FirestoreDataConverter<GameLobby> = {
    toFirestore: (lobby: GameLobby) => {
        return {
            lobby_key: lobby.lobby_key,
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