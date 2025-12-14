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
  /* Must be fetched separately from a Firebase subcollection. */
  player_states: Array<PlayerGameState> = [];
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
  /** Maps tag name to current card count from all decks' responses. */
  response_tags: Map<string, TagInGame> = new Map();

  /** ID of the next lobby, created as a copy of this lobby. */
  next_lobby_id?: string;

  constructor(
    public id: string,
    public creator_uid: string,
    public settings: LobbySettings,
    public status: LobbyStatus = 'new',
  ) {}

  orderedTags(): Array<TagInGame> {
    return [...this.response_tags.values()].sort((a, b) => a.order - b.order);
  }
}

export interface LobbySettings {
  max_players: number;
  play_until: PlayUntil;
  max_turns: number;
  max_score: number;
  turns_per_person: number;
  cards_per_person: number;
  cards_per_bot: number;
  /** If ture, unviewed cards will be dealt first. */
  new_cards_first: boolean;
  /** If true, card order will be affected by their rating. */
  sort_mode: SortMode;
  sort_cards_by_rating: boolean;
  sort_cards_by_views: boolean;
  sort_cards_by_discards: boolean;
  sort_cards_by_wins: boolean;
  sort_cards_by_prompt_votes: boolean;
  sort_cards_by_response_likes: boolean;
  /** Technical flag. If true, cards will be sorted by their IDs. */
  sort_by_id: boolean;
  /** If true, "good" cards can be put in front. */
  sort_cards_in_front: boolean;
  /* Multiplier for card index, applied to bad cards to put them later.
   * Values close to 0 will put them very far back. Value 1 means no sorting. */
  sort_min_factor: number;
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
  /** If true, players can request cards with specific tags during discard. */
  enable_tag_exchange: boolean;
  /** Who is allowed to change lobby settings and kick players during the game. */
  lobby_control: LobbyContol;
  /** Timer [seconds] for players to answer. 0 to disable. */
  answer_time_sec: number;
  /** Number of seconds until next turn auto-starts. 0 to disable. */
  next_turn_time_sec: number;
  /** How many discard tokens each player gets initially. */
  init_discard_tokens: number;
  /** Max number of discard tokens any player can get. */
  max_discard_tokens: number;
  /** If true, discarded cards will be put back into the deck, with a lower rank. */
  reuse_discarded_cards: boolean;
  /** If true, played cards will be put back into the deck, with a lower rank. */
  reuse_played_cards: boolean;
}

export function defaultLobbySettings(): LobbySettings {
  return {
    max_players: 20,
    play_until: 'max_turns',
    max_turns: 15,
    max_score: 5,
    turns_per_person: 3,
    cards_per_person: 12,
    cards_per_bot: 6,
    new_cards_first: false,
    sort_mode: 'by_rank_sqrt2_cutoff',
    sort_cards_by_rating: true,
    sort_cards_by_views: false,
    sort_cards_by_discards: true,
    sort_cards_by_wins: false,
    sort_cards_by_prompt_votes: true,
    sort_cards_by_response_likes: true,
    sort_cards_in_front: false,
    sort_by_id: false,
    sort_min_factor: 0.01,
    allow_join_mid_game: true,
    enable_likes: true,
    enable_soundboard: false,
    freeze_stats: false,
    show_likes_to: 'all_except_czar',
    likes_limit: 'none',
    discard_cost: 'token',
    enable_tag_exchange: true,
    lobby_control: 'players',
    answer_time_sec: 60.0,
    next_turn_time_sec: 5.0,
    init_discard_tokens: 1,
    max_discard_tokens: 4,
    reuse_discarded_cards: false,
    reuse_played_cards: false,
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
  | 'token' // 1 token per discard. Tokens are awarded for wins and likes.
  | '1_star'
  | '1_free_then_1_star'
  // "progress_hearts" | // 0 hearts, then 1 heart, then 2 hearts...
  // "1_free_then_5_hearts" |
  // "1_free_then_1_heart_per_card" | // each card costs 1 heart
  | 'no_discard';
// "anyone" includes spectators
export type LobbyContol = 'creator' | 'creator_or_czar' | 'players' | 'anyone';

/** Instance of a player specific to a single game lobby.
 * This contains basic player data that changes rarely. */
export class PlayerInLobby {
  time_joined: Date = new Date();

  constructor(
    public uid: string,
    public name: string,
    public avatar_id: string | null | undefined,
    /** Used for ordering players to select the next judge. */
    public random_index: number,
    public role: PlayerRole,
    public status: PlayerStatus,
    public is_bot: boolean = false,
  ) {}
}

/** Instance of player data pertaining to the game: hand, score etc. */
export class PlayerGameState {
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
    /** Current score accumulated over the entire game. */
    public score: number,
    /** How many turns were won. */
    public wins: number,
    /** Current number of likes accumulated over the entire game. */
    public likes: number,
    public discards_used: number,
    /** Tokens used for discards. */
    public discard_tokens: number,
  ) {}
}

// TODO: refactor for simpler APIs: store lobby ID inside turn, etc.
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
  /** Time when the current phase should end. */
  phase_end_time?: Date;

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

  get isRevealed(): boolean {
    return this.reveal_count >= this.cards.length;
  }
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

  constructor(
    public id: string,
    public title: string,
    public visibility: DeckVisibility,
    public tags: Array<DeckTag> = [],
    public time_created?: Date,
  ) {}
}

export class DeckTag {
  constructor(public name: string, public description?: string) {}
}

/** Tag info in a specific lobby.
 * Card count is updated as the cards are dealt. */
export class TagInGame {
  constructor(
    public order: number,
    public name: string,
    public card_count: number,
    public description?: string,
  ) {}
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
  likes: number;
  tags: string[];
  type: CardType;
  tier?: CardTier;
  /** What tier this card was at in every game.
   * Each item represents a single game, the most recent game is last. */
  tier_history: Array<CardTier>;
}

/** Prompt card in deck */
export class PromptDeckCard implements DeckCard {
  /** Doesn't apply to prompts */
  wins = 0;
  constructor(
    public id: string,
    public content: string,
    /** How many cards to pick in response */
    public pick: number,
    public rating: number,
    public views: number,
    public plays: number,
    public discards: number,
    public likes: number,
    public tags: string[],
    public upvotes: number,
    public downvotes: number,
    public tier?: CardTier,
    public tier_history: Array<CardTier> = [],
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
    public tier?: CardTier,
    public tier_history: Array<CardTier> = [],
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
  | 'repeat_last'
  // Repeats the previous player's reponse's first card
  | 'repeat_player_first'
  // Repeats the previous player's reponse's last card
  | 'repeat_player_last'
  // Repeats the previous winner's response's first card
  | 'repeat_winner_first'
  // Repeats the previous winner's response's last card
  | 'repeat_winner_last'
  // Picks any card that someone else is repeating during this turn
  | 'any_repeated_card'
  | 'czar_name';

export const allCardActions: Array<ResponseAction> = [
  'none',
  'repeat_last',
  'repeat_player_first',
  'repeat_player_last',
  'repeat_winner_first',
  'repeat_winner_last',
  'any_repeated_card',
  'czar_name',
];

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

export type LobbyStatus = 'new' | 'starting' | 'in_progress' | 'ended';

export type CardType = 'prompt' | 'response';

export type CardTier = 'top' | 'mid' | 'shit';
export const allCardTiers: Array<CardTier> = ['top', 'mid', 'shit'];

/** "kick" is re-joinable, "ban" is forever. */
export type KickAction = 'kick' | 'ban';

export type DeckVisibility = 'public' | 'hidden' | 'locked';

export type SortMode =
  /** Cards with lower rank appear strictly later in the deck */
  | 'by_rank_linear_cutoff'
  /** Cards with lower rank appear gradually later in the deck */
  | 'by_rank_sqrt_cutoff'
  /** Cards with lower rank appear even more gradually later in the deck */
  | 'by_rank_sqrt2_cutoff';

/** Used for cards created during a game, e.g haiku. */
export const GeneratedDeck = new Deck(
  '@@generated',
  'Generated cards',
  'public',
);

/** Used to count cards without tags. */
export const noTagsKey: string = '@@no_tags';
/** Used to count cards with any tags. */
export const anyTagsKey: string = '@@any_tags';

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
    public is_bot: boolean = false,
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

///////////////////////////////////////////////////////////////////////////////
//
//  Statistics types
//
///////////////////////////////////////////////////////////////////////////////

export type ResponseCardStats = Omit<
  ResponseCardInGame,
  'random_index' | 'rating' | 'type'
>;

export type PromptCardStats = Omit<
  PromptCardInGame,
  'random_index' | 'rating' | 'type' | 'votes'
>;

export type YearFilter = number | 'all_time';

/** Stored under /stats/{year}/users/{uid} */
export interface UserStats {
  uid: string;
  name: string; // the last known name
  player_in_lobby_refs: PlayerInLobby[]; // Should go in order of recency
  is_bot: boolean;
  total_games: number;
  total_turns_played: number;
  total_wins: number;
  total_likes_received: number;
  total_score: number;
  total_discards: number;
  average_score_per_game: number;
  win_rate: number; // wins per turn
  // To track unique games played (not persisted in Firestore)
  games?: Set<GameLobby>;
  lobby_ids: Set<string>;
  // New fields:
  first_time_played?: Date;
  last_time_played?: Date;
  /** Total time spent playing in milliseconds */
  total_time_played_ms: number;
  /** Average time per game in milliseconds */
  average_time_per_game_ms: number;
  /** Median time per game in milliseconds */
  median_time_per_game_ms: number;
  /** Median score per game */
  median_score_per_game: number;
  /** Individual game durations for calculating median */
  game_durations_ms: number[];
  /** Individual game scores for calculating median */
  game_scores: number[];
  /** Maps month string (YYYY-MM) to number of games played */
  games_per_month: Map<string, number>;
  /** Top cards used, sorted by frequency */
  top_cards_played: Array<{ card: ResponseCardStats; count: number }>;
  /** Top responses that received likes, normalized by lobby size */
  top_liked_responses: Array<{
    prompt: PromptCardStats;
    cards: ResponseCardStats[];
    likes: number;
    normalized_likes: number;
    lobby_size: number;
  }>;
  /** Top players this user has played with, sorted by frequency */
  top_teammates: Array<{ uid: string; name: string; games: number }>;
  /** Top prompts this user has chosen as judge, sorted by frequency */
  top_prompts_played: Array<{ prompt: PromptCardStats; count: number }>;
}

export interface GlobalStats {
  total_games: number;
  total_turns: number;
  unique_players: number;
  total_time_played_ms: number;
  median_time_per_game_ms: number;
  median_players_per_game: number;
  median_turns_per_game: number;
  /** Top prompts played across all games */
  top_prompts: Array<{ prompt: PromptCardStats; count: number }>;
  /** Top response cards played across all games */
  top_responses: Array<{ card: ResponseCardStats; count: number }>;
  /** Top decks used across all games */
  top_decks: Array<{ deck_id: string; games: number }>;
  /** Top months by number of games played */
  top_months: Array<{ month: string; games: number }>;
}

export * from './user-merge-map';
export * from './stats-container';
