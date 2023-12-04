export class GameLobby {
    id: string;
    /** Identifies the lobby, included in the link that's shared on Discord. */
    lobby_key: string;
    /** Null only during creation */
    time_created?: Date;
    creator_uid: string;
    status: LobbyStatus;

    /* Must be fetched separately from a Firebase subcollection. */
    players: Array<PlayerInLobby> = [];
    /** Helper array with UIDs, to find current game for a player. */
    player_uids: Array<string> = [];
    /** The last "turn" is the current state of the game board.
     * Must be fetched separately from a Firebase subcollection. */
    turns: Array<GameTurn> = [];

    /** Prompt cards remaining in the deck.
     * Must be fetched separately from a Firebase subcollection. */
    deck_prompts: Array<PromptDeckCard> = [];
    /** Response cards remaining in the deck.
     * Must be fetched separately from a Firebase subcollection. */
    deck_responses: Array<ResponseDeckCard> = [];

    constructor(
        id: string,
        lobby_key: string,
        creator_uid: string,
        status: LobbyStatus = "new",
    ) {
        this.id = id;
        this.lobby_key = lobby_key;
        this.creator_uid = creator_uid;
        this.status = status;
        this.player_uids = [creator_uid];
    }
}

/** Instance of a player specific to a single game lobby. */
export class PlayerInLobby {
    uid: string;
    name: string;
    avatar_url?: URL;
    spectator_status: SpectatorStatus;

    constructor(
        uid: string,
        name: string,
        spectator_status: SpectatorStatus = "player",
    ) {
        this.uid = uid;
        this.name = name;
        this.spectator_status = spectator_status;
    }
}

/** One turn, containing the entire state of the game board. */
export class GameTurn {
    //================= Main game stuff ===================
    /** UID of the player who will judge the winner. */
    judge_uid: string;
    /** The prompt that everyone is answering. */
    prompt: PromptCardInTurn;
    /** Maps player UID to what cards they have on hand in this turn.
     * Must be fetched separately from a Firebase subcollection. */
    player_data: Map<string, PlayerDataInTurn> = new Map();
    /** UID of the user who won this round */
    winner_uid?: string;

    //================== Technical stuff ==================
    id: string;
    /** Counts down to 0 in ms, to limit time for the next action. */
    timer_ms: number = 0;
    time_created: Date;
    phase: TurnPhase = "new";

    constructor(
        id: string,
        judge_uid: string,
        prompt: PromptCardInTurn,
        time_created: Date = new Date(),
    ) {
        this.id = id;
        this.judge_uid = judge_uid;
        this.prompt = prompt;
        this.time_created = time_created;
    }
}

/** State of the player in a turn. */
export class PlayerDataInTurn {
    player_uid: string;
    player_name: string; // Copied from 'Players' for convenience.
    /** Cards in the player's hand, including `current_response`. */
    hand: Array<ResponseCardInHand> = [];
    /** What cards they played in this turn. */
    current_play: Array<ResponseCardInHand> = [];

    constructor(player_uid: string, player_name: string) {
        this.player_uid = player_uid;
        this.player_name = player_name;
    }
}

/** Deck as an immutable collection that can be loaded into a game lobby. */
export class Deck {
    id: string;
    title: string;
    /** Must be fetched separately from a Firebase subcollection. */
    prompts: Array<PromptDeckCard> = [];
    /** Must be fetched separately from a Firebase subcollection. */
    responses: Array<ResponseDeckCard> = [];

    constructor(id: string, title: string) {
        this.id = id;
        this.title = title;
    }
}

/** Card in deck */
export abstract class DeckCard {
    /** ID is usually a number. */
    id: string;
    content: string;
    rating: number;
    constructor(id: string, content: string, rating: number = 0) {
        this.id = id;
        this.content = content;
        this.rating = rating;
    }
}


/** Prompt card in deck */
export class PromptDeckCard extends DeckCard {
    prompt() { } // hack to prevent duck typing
}

/** Response card in deck */
export class ResponseDeckCard extends DeckCard {
    response() { } // hack to prevent duck typing
}

/**
 * An instance of a card in hand. Contains a reference to the
 * original DeckCard and its cached content.
 */
export abstract class CardInHand {
    deck_id: string;
    card_id: string;
    content: string;
    constructor(deck_id: string, card_id: string, content: string) {
        this.deck_id = deck_id;
        this.card_id = card_id;
        this.content = content;
    }
}

/** An instance of a Prompt card played in a turn */
export class PromptCardInTurn extends CardInHand {
    prompt() { } // hack to prevent duck typing
}

/** An instance of a Response card in hand */
export class ResponseCardInHand extends CardInHand {
    response() { } // hack to prevent duck typing
}

export type SpectatorStatus = "player" | "spectator";

export type TurnPhase = "new" | "answering" | "reading" | "judging" | "complete";

export type LobbyStatus = "new" | "playing" | "ended";

/**
 * User data stored in the database.
 * Users should only be referenced by their UIDs.
 * Multiple users are allowed to have the same name!
*/
export class CAAUser {
    uid: string;
    email: string;
    name?: string;
    is_admin: boolean;

    constructor(
        uid: string,
        email: string,
        name: string | null | undefined = null,
        is_admin: boolean = false,
    ) {
        this.uid = uid;
        this.email = email;
        if (name) this.name = name;
        this.is_admin = is_admin;
    }
}