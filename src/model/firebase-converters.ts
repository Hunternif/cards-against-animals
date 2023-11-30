import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { CAAUser, Deck, GameLobby, GameTurn, PlayerAnswer, PlayerHand, PlayerInLobby } from "./types";

export const lobbyConverter: FirestoreDataConverter<GameLobby> = {
    toFirestore: (lobby: GameLobby) => {
        return {
            id: lobby.id,
            lobby_key: lobby.lobby_key,
            time_created: Timestamp.fromDate(lobby.time_created),
            players: lobby.players,
        }
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot) => {
        const data = snapshot.data();
        const time_created = data.time_created as Timestamp;
        const ret = new GameLobby(snapshot.id, data.lobby_key, time_created.toDate());
        ret.players = (data.players as Array<any>)?.map(
            (p) => new PlayerInLobby(p.name, p.spectator_status)
        ) || [];
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

export const turnConverter: FirestoreDataConverter<GameTurn> = {
    toFirestore: (turn: GameTurn) => {
        return {
            judge_name: turn.judge_name,
            question: turn.question,
            player_hands: Object.fromEntries(turn.player_hands.entries()),
            // Answers are actually stored as simple arrays, not the PlayerAnswer object.
            // We map it to object here for consistency with winning_answer:
            player_answers: Object.fromEntries(
                Array.from(turn.player_answers.values())
                    .map((a) => [a.player_name, a.answer])
            ),
            winning_answer: turn.winning_answer,
            id: turn.id,
            timer_ms: turn.timer_ms,
            time_created: Timestamp.fromDate(turn.time_created),
            phase: turn.phase,
            deck_questions: turn.deck_questions,
            deck_answers: turn.deck_answers,
        }
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot) => {
        const data = snapshot.data();
        const time_created = data.time_created as Timestamp;
        const ret = new GameTurn(
            snapshot.id,
            data.judge_name,
            data.question,
            time_created.toDate(),
        );
        ret.timer_ms = data.timer_ms || 0;
        ret.phase = data.phase || "new";
        ret.deck_questions = data.deck_questions || [];
        ret.deck_answers = data.deck_answers || [];
        if (data.winning_answer) {
            ret.winning_answer = new PlayerAnswer(
                data.winning_answer.player_name,
                data.winning_answer.answer,
            );
        }
        // Object.entries does not guarantee order!
        // TODO: if order of players is important, need to use array instead.
        ret.player_hands = new Map(
            Object.entries<any>(data.player_hands || {})
                .map(([k, v]) => [k, new PlayerHand(k, v.hand_answers, v.won_questions)])
        );
        // Answers are actually stored as simple arrays, not the PlayerAnswer object.
        // We map it to object here for consistency with winning_answer:
        ret.player_answers = new Map(
            Object.entries<any>(data.player_answers || {})
                .map(([k, v]) => [k, new PlayerAnswer(k, v as Array<string>)])
        );
        return ret;
    }
}

export const userConverter: FirestoreDataConverter<CAAUser> = {
    toFirestore: (user: CAAUser) => user,
    fromFirestore: (snapshot: QueryDocumentSnapshot) => {
        const data = snapshot.data();
        return new CAAUser(data.name, data.email, data.is_admin ?? false);
    }
}