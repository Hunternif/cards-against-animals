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

  /** ID of the next lobby, created as a copy of this lobby. */
  next_lobby_id?: string;

  constructor(
    public id: string,
    public creator_uid: string,
    public settings: LobbySettings,
    public status: LobbyStatus = 'new',
  ) {}
}

export interface LobbySettings {
  max_players: number;
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
  enable_soundboard: boolean;
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
    max_players: 20,
    play_until: 'max_turns_per_person',
    max_turns: 10,
    max_score: 5,
    turns_per_person: 3,
    cards_per_person: 10,
    new_cards_first: false,
    sort_cards_by_rating: true,
    allow_join_mid_game: true,
    enable_likes: true,
    enable_soundboard: false,
    freeze_stats: false,
    show_likes_to: 'all_except_czar',
    likes_limit: 'none',
    discard_cost: '1_free_then_1_star',
    lobby_control: 'creator',
    next_turn_time_sec: 4.0,
  };
}

export type PlayUntil =
  | 'forever'
  | 'max_turns'
  | 'max_turns_per_person'
  | 'max_score';
export type ShowLikes = 'all' | 'all_except_czar';
export type LikesLimit = '1_pp_per_turn' | 'none';
export type DiscardCost =
  | 'free'
  | '1_star'
  | '1_free_then_1_star'
  // "progress_hearts" | // 0 hearts, then 1 heart, then 2 hearts...
  // "1_free_then_5_hearts" |
  // "1_free_then_1_heart_per_card" | // each card costs 1 heart
  | 'no_discard';
// "anyone" includes spectators
export type LobbyContol = 'creator' | 'creator_or_czar' | 'players' | 'anyone';

/** Instance of a player specific to a single game lobby. */
export class PlayerInLobby {
  time_joined: Date = new Date();
  /** Time when the player was last dealt new cards.
   * This helps keep track of new cards. */
  time_dealt_cards: Date = new Date();

  /** Cards in the player's hand. Maps card id to data. */
  hand: Map<string, ResponseCardInHand> = new Map();
  /** Cards that were discarded throughout the game. Maps card id to data. */

  discarded: Map<string, ResponseCardInGame> = new Map();

  /** Whenever the player downvotes a card, it goes here.
   * Map field on the document, maps unique card id to card data. */
  downvoted: Map<string, ResponseCardInGame> = new Map();

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
  ) {}
}

/** One turn, containing the entire state of the game board. */
export class GameTurn {
  //================= Main game stuff ===================
  /** DEPRECATED. Use subcollection 'prompts' instead. */
  legacy_prompt?: PromptCardInGame;
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
  phase: TurnPhase = 'new';
  /** Time when the last phase bagan. */
  phase_start_time: Date = this.time_created;

  constructor(
    public id: string,
    /** Turn's ordinal number: 1, 2, 3, ... */
    public ordinal: number,
    /** UID of the player who will judge the winner. */
    public judge_uid: string,
    public time_created: Date = new Date(),
  ) {}
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
  ) {}
}

/** Represents a player who voted on a card, e.g. like or dislike. */
export class Vote {
  constructor(
    public player_uid: string,
    public player_name: string, // Copied from 'Players' for convenience.
    public choice: VoteChoice,
  ) {}
}

export type VoteChoice = 'yes' | 'no';

/** Deck as an immutable collection that can be loaded into a game lobby. */
export class Deck {
  /** Must be fetched separately from a Firebase subcollection. */
  prompts: Array<PromptDeckCard> = [];
  /** Must be fetched separately from a Firebase subcollection. */
  responses: Array<ResponseDeckCard> = [];
  /** Must be fetched separately from a Firebase subcollection. */
  //TODO: move tags within deck.
  tags: DeckTag[] = [];

  constructor(
    public id: string,
    public title: string,
    public time_created?: Date,
    public visibility: DeckVisibility = 'public',
  ) {}
}

export class DeckTag {
  constructor(public name: string, public description?: string) {}
}

/** Used to lock access to decks with a password.
 * The player must have a 'key' record with the same hash.
 */
export class DeckLock {
  constructor(public deck_id: string, public hash: string) {}
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
    public time_created?: Date,
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prompt() {} // hack to prevent duck typing
  type: CardType = 'prompt';
}

/** Response card in deck */
//TODO: use marker field and merge Response and Prompt types into one.
export class ResponseDeckCard implements DeckCard {
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
    public time_created?: Date,
    public action?: ResponseAction,
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  response() {} // hack to prevent duck typing
  type: CardType = 'response';
}

/** Custom actions for response cards. */
export type ResponseAction =
  | 'none'
  // Repeats the previous card
  | 'repeat_last';

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
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prompt() {} // hack to prevent duck typing
  type: CardType = 'prompt';
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
    public tags: string[],
    public action?: ResponseAction,
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  response() {} // hack to prevent duck typing
  type: CardType = 'response';
}

/** An instance of a Response card in player's hand. */
export class ResponseCardInHand extends ResponseCardInGame {
  /** When the player receive this card */
  time_received: Date = new Date();
  static create(from: ResponseCardInGame, time: Date): ResponseCardInHand {
    const ret = new ResponseCardInHand(
      from.id,
      from.deck_id,
      from.card_id_in_deck,
      from.random_index,
      from.content,
      from.rating,
      from.tags,
      from.action,
    );
    ret.time_received = time;
    return ret;
  }
}

export type PlayerRole = 'player' | 'spectator';

export type PlayerStatus = 'online' | 'left' | 'banned';

export type TurnPhase = 'new' | 'answering' | 'reading' | 'complete';

export type LobbyStatus = 'new' | 'in_progress' | 'ended';

export type CardType = 'prompt' | 'response';

/** "kick" is re-joinable, "ban" is forever. */
export type KickAction = 'kick' | 'ban';

export type DeckVisibility = 'public' | 'hidden' | 'locked';

/** Used for cards created during a game, e.g haiku. */
export const GeneratedDeck = new Deck('@@generated', 'Generated cards');

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
  ) {}
  /** Maps deck ID to a lock key.
   * Using the same type 'DeckLock' for convenience.
   * Stored in a firebase subcollection and never fetched. */
  private deck_keys?: Map<string, DeckLock>;
}

/**
 * When migrating legacy decks, this temp table can be created to store
 * mapped card IDs: from old deck to new deck.
 * This can be useful when calculating historical usage statistics.
 */
export class DeckMigrationItem {
  constructor(
    /** Includes deck and type, e.g. 'my_deck_prompt_0001 */
    public old_card_unique_id: string,
    /** Includes deck and type, e.g. 'my_deck_prompt_0001 */
    public new_card_unique_id: string,
    public type: CardType,
    public old_deck_id: string,
    /** card id in deck */
    public old_card_id: string,
    public new_deck_id: string,
    /** card id in deck */
    public new_card_id: string,
    public time_created?: Date,
  ) {}
}

/** When someone uses the soundboard */
export class SoundEvent {
  constructor(
    public player_uid: string,
    public player_name: string,
    public sound_id: string,
    /** 0 time means the server will populate it */
    public time: Date = new Date(0),
  ) {}
}

/** Used in Firebase RTDB to report user's online status */
export type DBPresence = {
  state: 'online' | 'offline';
  /** Server timestamp in ms */
  last_changed: number;
};
/** Used in Firebase RTDB to report user's online status.
 * This type is used for writing the change, with a placeholder for time. */
export type DBPresenceToWrite = Omit<DBPresence, 'last_changed'> & {
  last_changed: object; // placeholder for server timestamp
};
