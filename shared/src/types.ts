///////////////////////////////////////////////////////////////////////////////
//
//  This file contains Firestore type definitions shared between client and
//  server functions. When building client & functions, this file will be
//  copied to their source folders.
//
///////////////////////////////////////////////////////////////////////////////

export class GameLobby {
  id: string;
  /** Null only during creation */
  time_created?: Date;
  creator_uid: string;
  status: LobbyStatus;
  settings: LobbySettings;

  /* Must be fetched separately from a Firebase subcollection. */
  players: Array<PlayerInLobby> = [];
  /** The last "turn" is the current state of the game board.
   * Must be fetched separately from a Firebase subcollection. */
  turns: Array<GameTurn> = [];

  /** List of deck IDs selected for this lobby */
  deck_ids: Set<string> = new Set();
  /** Prompt cards remaining in the deck.
   * Must be fetched separately from a Firebase subcollection. */
  deck_prompts: Array<PromptCardInGame> = [];
  /** Response cards remaining in the deck.
   * Must be fetched separately from a Firebase subcollection. */
  deck_responses: Array<ResponseCardInGame> = [];

  constructor(
    id: string,
    creator_uid: string,
    settings: LobbySettings,
    status: LobbyStatus = "new",
  ) {
    this.id = id;
    this.creator_uid = creator_uid;
    this.settings = settings;
    this.status = status;
  }
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
}

export function defaultLobbySettings(): LobbySettings {
  return {
    play_until: "max_turns_per_person",
    max_turns: 10,
    max_score: 5,
    turns_per_person: 3,
    cards_per_person: 10,
    new_cards_first: true,
    sort_cards_by_rating: true,
    allow_join_mid_game: true,
    enable_likes: true,
    freeze_stats: false,
    show_likes_to: "all_except_czar",
    likes_limit: "none",
    discard_cost: "1_free_then_1_star",
  };
}

export type PlayUntil = "forever" | "max_turns" | "max_turns_per_person" | "max_score";
export type ShowLikes = "all" | "all_except_czar";
export type LikesLimit = "1_pp_per_turn" | "none";
export type DiscardCost = "free" | "1_star" | "1_free_then_1_star" | "no_discard";

/** Instance of a player specific to a single game lobby. */
export class PlayerInLobby {
  uid: string;
  name: string;
  avatar_url?: URL;
  role: PlayerRole;
  status: PlayerStatus;
  time_joined?: Date;
  /** Current score accumulated over the entire game. */
  score: number;
  /** Current number of likes accumulated over the entire game. */
  likes: number;
  /** Number of turns where the user used discards. */
  discards_used: number;
  /** Used for ordering players to select the next judge. */
  random_index: number;

  constructor(
    uid: string,
    name: string,
    random_index: number,
    role: PlayerRole,
    status: PlayerStatus,
    score: number,
    likes: number,
    discards_used: number,
  ) {
    this.uid = uid;
    this.name = name;
    this.random_index = random_index;
    this.role = role;
    this.status = status;
    this.score = score;
    this.likes = likes;
    this.discards_used = discards_used;
  }
}

/** One turn, containing the entire state of the game board. */
export class GameTurn {
  //================= Main game stuff ===================
  /** UID of the player who will judge the winner. */
  judge_uid: string;
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
  id: string;
  /** Turn's ordinal number: 1, 2, 3, ... */
  ordinal: number;
  /** Counts down to 0 in ms, to limit time for the next action. */
  timer_ms: number = 0;
  time_created: Date;
  phase: TurnPhase = "new";

  constructor(
    id: string,
    ordinal: number,
    judge_uid: string,
    time_created: Date = new Date(),
  ) {
    this.id = id;
    this.ordinal = ordinal;
    this.judge_uid = judge_uid;
    this.time_created = time_created;
  }
}

/** State of the player in a turn. */
export class PlayerDataInTurn {
  player_uid: string;
  player_name: string; // Copied from 'Players' for convenience.
  /** Cards in the player's hand, including `current_response`.
   * Must be fetched separately from a Firebase subcollection. */
  hand: Array<ResponseCardInGame> = [];
  /** Cards that were discarded this turn.
   * Must be fetched separately from a Firebase subcollection. */
  discarded: Array<ResponseCardInGame> = [];

  constructor(player_uid: string, player_name: string) {
    this.player_uid = player_uid;
    this.player_name = player_name;
  }
}

/** Player's submitted cards in a turn. */
export class PlayerResponse {
  player_uid: string;
  player_name: string; // Copied from 'Players' for convenience.
  cards: Array<ResponseCardInGame>;
  random_index: number;
  revealed: boolean;
  /** Will be updated after the turn completes. */
  like_count?: number;
  /** List of players who liked this response.
   * Must be fetched separately from a Firebase subcollection. */
  likes: Array<Vote> = [];

  constructor(
    player_uid: string, player_name: string, cards: Array<ResponseCardInGame>,
    random_index: number, revealed: boolean, like_count: number | undefined,
  ) {
    this.player_uid = player_uid;
    this.player_name = player_name;
    this.cards = cards;
    this.random_index = random_index;
    this.revealed = revealed;
    this.like_count = like_count;
  }
}

/** Represents a player who voted on a card, e.g. like or dislike. */
export class Vote {
  player_uid: string;
  player_name: string; // Copied from 'Players' for convenience.
  choice: VoteChoice;
  constructor(player_uid: string, player_name: string, choice: VoteChoice) {
    this.player_uid = player_uid;
    this.player_name = player_name;
    this.choice = choice;
  }
}

export type VoteChoice = "yes" | "no";

/** Deck as an immutable collection that can be loaded into a game lobby. */
export class Deck {
  id: string;
  title: string;
  /** Must be fetched separately from a Firebase subcollection. */
  prompts: Array<PromptDeckCard> = [];
  /** Must be fetched separately from a Firebase subcollection. */
  responses: Array<ResponseDeckCard> = [];
  /** Must be fetched separately from a Firebase subcollection. */
  tags: DeckTag[] = [];

  constructor(id: string, title: string) {
    this.id = id;
    this.title = title;
  }
}

export class DeckTag {
  name: string;
  description?: string;
  constructor(name: string, description?: string) {
    this.name = name;
    this.description = description;
  }
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
}


/** Prompt card in deck */
export class PromptDeckCard implements DeckCard {
  id: string;
  content: string;
  rating: number;
  /** How many cards to pick in response */
  pick: number;
  time_created?: Date;
  views: number;
  plays: number;
  discards: number;
  wins: number;
  tags: string[];
  upvotes: number;
  downvotes: number;
  constructor(
    id: string, content: string, pick: number, rating: number,
    views: number, plays: number, discards: number,
    tags: string[], upvotes: number, downvotes: number,
  ) {
    this.id = id;
    this.content = content;
    this.pick = pick;
    this.rating = rating || 0;
    this.views = views || 0;
    this.plays = plays || 0;
    this.discards = discards || 0;
    this.wins = 0;
    this.tags = tags;
    this.upvotes = upvotes || 0;
    this.downvotes = downvotes || 0;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prompt() { } // hack to prevent duck typing
}

/** Response card in deck */
export class ResponseDeckCard implements DeckCard {
  id: string;
  content: string;
  rating: number;
  time_created?: Date;
  views: number;
  plays: number;
  discards: number;
  wins: number;
  likes: number;
  tags: string[];
  constructor(
    id: string, content: string, rating: number,
    views: number, plays: number, discards: number, wins: number, likes: number,
    tags: string[],
  ) {
    this.id = id;
    this.content = content;
    this.rating = rating || 0;
    this.views = views || 0;
    this.plays = plays || 0;
    this.discards = discards || 0;
    this.wins = wins || 0;
    this.likes = likes || 0;
    this.tags = tags;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  response() { } // hack to prevent duck typing
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
}

/** An instance of a Prompt card in a game */
export class PromptCardInGame implements CardInGame {
  id: string;
  deck_id: string;
  card_id_in_deck: string;
  random_index: number;
  content: string;
  pick: number;
  rating: number;
  /** List of player votes who liked or disliked this prompt.
   * Must be fetched separately from a Firebase subcollection. */
  votes: Array<Vote> = [];
  constructor(
    id: string,
    deck_id: string,
    card_id_in_deck: string,
    random_index: number,
    content: string,
    pick: number,
    rating: number,
  ) {
    this.id = id;
    this.deck_id = deck_id;
    this.card_id_in_deck = card_id_in_deck;
    this.random_index = random_index;
    this.content = content;
    this.pick = pick;
    this.rating = rating;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prompt() { } // hack to prevent duck typing
}

/** An instance of a Response card in game */
export class ResponseCardInGame implements CardInGame {
  id: string;
  deck_id: string;
  card_id_in_deck: string;
  random_index: number;
  content: string;
  rating: number;
  /** Can be downvoted once per lobby. Downvoting decreases rating.
   * TODO: maybe convert this downvote to a subcollection of Votes. */
  downvoted: boolean;
  constructor(
    id: string,
    deck_id: string,
    card_id_in_deck: string,
    random_index: number,
    content: string,
    rating: number,
    downvoted: boolean,
  ) {
    this.id = id;
    this.deck_id = deck_id;
    this.card_id_in_deck = card_id_in_deck;
    this.random_index = random_index;
    this.content = content;
    this.rating = rating;
    this.downvoted = downvoted;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  response() { } // hack to prevent duck typing
}

export type PlayerRole = "player" | "spectator";

export type PlayerStatus = "online" | "left" | "kicked";

export type TurnPhase = "new" | "answering" | "reading" | "complete";

export type LobbyStatus = "new" | "in_progress" | "ended";

/**
 * User data stored in the database.
 * Users should only be referenced by their UIDs.
 * Multiple users are allowed to have the same name!
*/
export class CAAUser {
  uid: string;
  email?: string;
  name?: string;
  is_admin: boolean;
  current_lobby_id?: string;

  constructor(
    uid: string,
    email: string | null | undefined = null,
    name: string | null | undefined = null,
    is_admin: boolean = false,
    current_lobby_id: string | null | undefined = null,
  ) {
    this.uid = uid;
    if (email) this.email = email;
    if (name) this.name = name;
    this.is_admin = is_admin;
    if (current_lobby_id) this.current_lobby_id = current_lobby_id;
  }
}