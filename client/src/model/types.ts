export class GameLobby {
    id: string;
    /** Identifies the lobby, included in the link that's shared on Discord. */
    lobby_key: string;
    time_created: Date;
    players: Array<PlayerInLobby> = [];
    /** The last "turn" is the current state of the game board. */
    turns: Array<GameTurn> = [];

    constructor(id: string, lobby_key: string, time_created: Date = new Date()) {
        this.id = id;
        this.lobby_key = lobby_key;
        this.time_created = time_created;
    }
}

/** Instance of a player specific to a single game lobby. */
export class PlayerInLobby {
    name: string;
    avatar_url?: URL;
    spectator_status: SpectatorStatus;

    constructor(name: string, spectator_status: SpectatorStatus = "player") {
        this.name = name;
        this.spectator_status = spectator_status;
    }
}

/** One turn, containing the entire state of the game board. */
export class GameTurn {
    //================= Main game stuff ===================
    /** Player who will judge the winner. */
    judge_name: string;
    /** The question that everyone is answering. */
    question: string;
    /** Maps player name to what cards they have on hand. */
    player_hands: Map<string, PlayerHand> = new Map();
    /** Maps player name to what answer they played. */
    player_answers: Map<string, PlayerAnswer> = new Map();
    winning_answer?: PlayerAnswer;

    //================== Technical stuff ==================
    id: string;
    /** Counts down to 0 in ms, to limit time for the next action. */
    timer_ms: number = 0;
    time_created: Date;
    phase: TurnPhase = "new";

    /** Cards remaining in the deck. */
    deck_questions: Array<string> = [];
    /** Cards remaining in the deck. */
    deck_answers: Array<string> = [];

    constructor(
        id: string,
        judge_name: string,
        question: string,
        time_created: Date = new Date(),
    ) {
        this.id = id;
        this.judge_name = judge_name;
        this.question = question;
        this.time_created = time_created;
    }
}

/** What cards a player played in a turn */
export class PlayerAnswer {
    player_name: string;
    /** Contains multiple cards if the question requires so. */
    answer: Array<string>;
    constructor(player_name: string, answer: Array<string>) {
        this.player_name = player_name;
        this.answer = answer;
    }
}

/** State of the player in a turn. */
export class PlayerHand {
    player_name: string;
    hand_answers: Array<string>;
    won_questions: Array<string>;

    constructor(
        player_name: string,
        hand_answers:  Array<string> = [],
        won_questions: Array<string> = []
    ) {
        this.player_name = player_name;
        this.hand_answers = hand_answers;
        this.won_questions = won_questions;
    }
}

/** Deck as an immutable collection that can be loaded into a game lobby. */
export class Deck {
    title: string;
    questions: Array<string> = [];
    answers: Array<string> = [];

    constructor(title: string) {
        this.title = title;
    }
}

export type SpectatorStatus = "player" | "spectator";

export type TurnPhase = "new" | "answering" | "reading" | "judging" | "complete";

/** User data stored in the database */
export class CAAUser {
    email: string;
    name?: string;
    is_admin: boolean;

    constructor(
        email: string,
        name: string | null | undefined = null,
        is_admin: boolean = false,
    ) {
        this.email = email;
        if (name) this.name = name;
        this.is_admin = is_admin;
    }
}