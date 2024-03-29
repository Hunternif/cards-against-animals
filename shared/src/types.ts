///////////////////////////////////////////////////////////////////////////////
//
//  This file contains Firestore type definitions shared between client and
//  server functions. When building client & functions, this file will be
//  copied to their source folders.
//
///////////////////////////////////////////////////////////////////////////////

export class GameLobby {
  /** Null only during creation */
  time_created?: Date;

  /* Must be fetched separately from a Firebase subcollection. */
  players: Array<PlayerInLobby> = [];
  /** The last "turn" is the current state of the game board.
   * Must be fetched separately from a Firebase subcollection. */
  turns: Array<GameTurn> = [];
  /** ID of the most recent turn. */
  current_turn_id?: string;

  /** List of deck IDs selected for this lobby */
  deck_ids: Set<string> = new Set();
  /** Prompt cards remaining in the deck.
   * Must be fetched separately from a Firebase subcollection. */
  deck_prompts: Array<PromptCardInGame> = [];
  /** Response cards remaining in the deck.
   * Must be fetched separately from a Firebase subcollection. */
  deck_responses: Array<ResponseCardInGame> = [];

  constructor(
    public id: string,
    public creator_uid: string,
    public settings: LobbySettings,
    public status: LobbyStatus = "new",
  ) { }
}

export interface LobbySettings {
  play_until: PlayUntil;
  max_turns: number;
  max_score: number;
  turns_per_person: number;
  cards_per_person: number;
  /** If ture, unviewed cards will be dealt first. */
  new_cards_first: boolean;
  /** If true, card order will be affected by their rating. */
  sort_cards_by_rating: boolean;
  /** If true, players can join after the game has started. */
  allow_join_mid_game: boolean;
  /** If true, players can like responses. */
  enable_likes: boolean;
  /** If true, card statistics will not be updated. */
  freeze_stats: boolean;
  show_likes_to: ShowLikes;
  /** How many likes a player can give */
  likes_limit: LikesLimit;
  /** How much does it cost for the player to discard cards, per turn. */
  discard_cost: DiscardCost;
  /** Who is allowed to change lobby settings and kick players during the game. */
  lobby_control: LobbyContol;
  /** Number of seconds until next turn auto-starts. 0 to disable. */
  next_turn_time_sec: number;
}

export function defaultLobbySettings(): LobbySettings {
  return {
    play_until: "max_turns_per_person",
    max_turns: 10,
    max_score: 5,
    turns_per_person: 3,
    cards_per_person: 10,
    new_cards_first: false,
    sort_cards_by_rating: true,
    allow_join_mid_game: true,
    enable_likes: true,
    freeze_stats: false,
    show_likes_to: "all_except_czar",
    likes_limit: "none",
    discard_cost: "1_free_then_1_star",
    lobby_control: "anyone",
    next_turn_time_sec: 4.0,
  };
}

export type PlayUntil = "forever" | "max_turns" | "max_turns_per_person" | "max_score";
export type ShowLikes = "all" | "all_except_czar";
export type LikesLimit = "1_pp_per_turn" | "none";
export type DiscardCost = "free" | "1_star" | "1_free_then_1_star" | "no_discard";
export type LobbyContol = "creator" | "czar" | "anyone";

/** Instance of a player specific to a single game lobby. */
export class PlayerInLobby {
  time_joined?: Date;

  constructor(
    public uid: string,
    public name: string,
    public avatar_id: string | null | undefined,
    /** Used for ordering players to select the next judge. */
    public random_index: number,
    public role: PlayerRole,
    public status: PlayerStatus,
    /** Current score accumulated over the entire game. */
    public score: number,
    /** How many turns were won. */
    public wins: number,
    /** Current number of likes accumulated over the entire game. */
    public likes: number,
    public discards_used: number,
  ) { }
}

/** One turn, containing the entire state of the game board. */
export class GameTurn {
  //================= Main game stuff ===================
  /** DEPRECATED. Use subcollection 'prompts' instead. */
  legacy_prompt?: PromptCardInGame;
  /** Maps player UID to what cards they have on hand in this turn.
   * Must be fetched separately from a Firebase subcollection. */
  player_data: Map<string, PlayerDataInTurn> = new Map();
  /** Maps player UID to what cards they played in this turn.
   * Must be fetched separately from a Firebase subcollection.
   * Making this a separate collection makes it secure for players to submit
   * directly to Firestore, without a function.*/
  player_responses: Map<string, PlayerResponse> = new Map();
  /** UID of the user who won this round */
  winner_uid?: string;
  /** UIDs of audience choice winners this round */
  audience_award_uids: Array<string> = [];
  /**
   * The prompt that everyone is answering. Usually there is only one,
   * but new game modes could include multiple prompts.
   * Must be fetched separately from a Firebase subcollection.
   */
  prompts: Array<PromptCardInGame> = [];

  //================== Technical stuff ==================
  phase: TurnPhase = "new";
  /** Time when the last phase bagan. */
  phase_start_time: Date = this.time_created;

  constructor(
    public id: string,
    /** Turn's ordinal number: 1, 2, 3, ... */
    public ordinal: number,
    /** UID of the player who will judge the winner. */
    public judge_uid: string,
    public time_created: Date = new Date(),
  ) { }
}

/** State of the player in a turn. */
export class PlayerDataInTurn {
  /** Cards in the player's hand, including `current_response`.
   * Must be fetched separately from a Firebase subcollection. */
  hand: Array<ResponseCardInGame> = [];
  /** Cards that were discarded this turn.
   * Must be fetched separately from a Firebase subcollection. */
  discarded: Array<ResponseCardInGame> = [];

  constructor(
    public player_uid: string,
    public player_name: string, // Copied from 'Players' for convenience.
  ) { }
}

/** Player's submitted cards in a turn. */
export class PlayerResponse {
  /** List of players who liked this response.
   * Must be fetched separately from a Firebase subcollection. */
  likes: Array<Vote> = [];

  constructor(
    public player_uid: string,
    public player_name: string, // Copied from 'Players' for convenience.
    public cards: Array<ResponseCardInGame>,
    /** For sorting */
    public random_index: number,
    /** How many cards in this response were revealed */
    public reveal_count: number,
    /** Will be updated after the turn completes. */
    public like_count: number | undefined,
  ) { }
}

/** Represents a player who voted on a card, e.g. like or dislike. */
export class Vote {
  constructor(
    public player_uid: string,
    public player_name: string, // Copied from 'Players' for convenience.
    public choice: VoteChoice,
  ) { }
}

export type VoteChoice = "yes" | "no";

/** Deck as an immutable collection that can be loaded into a game lobby. */
export class Deck {
  /** Must be fetched separately from a Firebase subcollection. */
  prompts: Array<PromptDeckCard> = [];
  /** Must be fetched separately from a Firebase subcollection. */
  responses: Array<ResponseDeckCard> = [];
  /** Must be fetched separately from a Firebase subcollection. */
  tags: DeckTag[] = [];

  constructor(public id: string, public title: string) { }
}

export class DeckTag {
  constructor(public name: string, public description?: string) { }
}

/** Card in deck */
export interface DeckCard {
  /** ID is usually a number. */
  id: string;
  content: string;
  rating: number;
  time_created?: Date;
  /** Analytics: how many times this card was viewed */
  views: number;
  /** Analytics: how many times this card was played */
  plays: number;
  /** Analytics: how many times this card was discarded */
  discards: number;
  /** Analytics: how many times this card won a turn */
  wins: number;
  tags: string[];
  type: CardType;
}


/** Prompt card in deck */
export class PromptDeckCard implements DeckCard {
  wins = 0; // doesn't apply to prompts
  time_created?: Date;
  constructor(
    public id: string,
    public content: string,
    /** How many cards to pick in response */
    public pick: number,
    public rating: number,
    public views: number,
    public plays: number,
    public discards: number,
    public tags: string[],
    public upvotes: number,
    public downvotes: number,
  ) { }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prompt() { } // hack to prevent duck typing
  type: CardType = "prompt";
}

/** Response card in deck */
export class ResponseDeckCard implements DeckCard {
  time_created?: Date;
  constructor(
    public id: string,
    public content: string,
    public rating: number,
    public views: number,
    public plays: number,
    public discards: number,
    public wins: number,
    public likes: number,
    public tags: string[],
  ) { }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  response() { } // hack to prevent duck typing
  type: CardType = "response";
}

/**
 * An instance of a card in game. Contains a reference to the
 * original DeckCard and its cached content.
 */
export interface CardInGame {
  /** Unique ID that identifies this card across the whole app.
   * Usually combines deck id and card id. */
  id: string;
  deck_id: string;
  /** Card id within the deck */
  card_id_in_deck: string;
  /** Used for selecting a random card. Cards are sorted by random_index
   * in descending order, so that card with index 0 will be drawn last. */
  random_index: number;
  content: string;
  rating: number;
  tags: string[];
  type: CardType;
}

/** An instance of a Prompt card in a game */
export class PromptCardInGame implements CardInGame {
  /** List of player votes who liked or disliked this prompt.
   * Must be fetched separately from a Firebase subcollection. */
  votes: Array<Vote> = [];
  constructor(
    public id: string,
    public deck_id: string,
    public card_id_in_deck: string,
    public random_index: number,
    public content: string,
    public pick: number,
    public rating: number,
    public tags: string[],
  ) { }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prompt() { } // hack to prevent duck typing
  type: CardType = "prompt";
}

/** An instance of a Response card in game */
export class ResponseCardInGame implements CardInGame {
  constructor(
    public id: string,
    public deck_id: string,
    public card_id_in_deck: string,
    public random_index: number,
    public content: string,
    public rating: number,
    /**
     * True if downvoted by the player who owns this card.
     * Can be downvoted once per game. Downvoting decreases rating.
     * TODO: maybe convert this downvote to a subcollection of Votes.
     */
    public downvoted: boolean,
    public tags: string[],
  ) { }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  response() { } // hack to prevent duck typing
  type: CardType = "response";
}

export type PlayerRole = "player" | "spectator";

export type PlayerStatus = "online" | "left" | "kicked";

export type TurnPhase = "new" | "answering" | "reading" | "complete";

export type LobbyStatus = "new" | "in_progress" | "ended";

export type CardType = "prompt" | "response";

/**
 * User data stored in the database.
 * Users should only be referenced by their UIDs.
 * Multiple users are allowed to have the same name!
*/
export class CAAUser {
  constructor(
    public uid: string,
    public email: string | null | undefined = null,
    public name: string,
    public avatar_id: string | null | undefined = null,
    public is_admin: boolean = false,
    public current_lobby_id: string | null | undefined = null,
  ) { }
}