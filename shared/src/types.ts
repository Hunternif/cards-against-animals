///////////////////////////////////////////////////////////////////////////////
//
//  This file contains Firestore type definitions shared between client and
//  server functions. When building client & functions, this file will be
//  copied to their source folders.
//
///////////////////////////////////////////////////////////////////////////////

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
    lobby_key: string,
    creator_uid: string,
    status: LobbyStatus = "new",
  ) {
    this.id = id;
    this.lobby_key = lobby_key;
    this.creator_uid = creator_uid;
    this.status = status;
  }
}

/** Instance of a player specific to a single game lobby. */
export class PlayerInLobby {
  uid: string;
  name: string;
  avatar_url?: URL;
  role: PlayerRole;

  constructor(
    uid: string,
    name: string,
    role: PlayerRole = "player",
  ) {
    this.uid = uid;
    this.name = name;
    this.role = role;
  }
}

/** One turn, containing the entire state of the game board. */
export class GameTurn {
  //================= Main game stuff ===================
  /** UID of the player who will judge the winner. */
  judge_uid: string;
  /** The prompt that everyone is answering. */
  prompt: PromptCardInGame;
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
    prompt: PromptCardInGame,
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
  hand: Array<ResponseCardInGame> = [];
  /** What cards they played in this turn. */
  current_play: Array<ResponseCardInGame> = [];

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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prompt() { } // hack to prevent duck typing
}

/** Response card in deck */
export class ResponseDeckCard extends DeckCard {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  response() { } // hack to prevent duck typing
}

/**
 * An instance of a card in game. Contains a reference to the
 * original DeckCard and its cached content.
 */
export abstract class CardInGame {
  id: string;
  deck_id: string;
  card_id: string;
  /** Used for selecting a random card */
  random_index: number;
  content: string;
  rating: number;
  constructor(
    id: string,
    deck_id: string,
    card_id: string,
    random_index: number,
    content: string,
    rating: number,
  ) {
    this.id = id;
    this.deck_id = deck_id;
    this.card_id = card_id;
    this.random_index = random_index;
    this.content = content;
    this.rating = rating;
  }
}

/** An instance of a Prompt card in a game */
export class PromptCardInGame extends CardInGame {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prompt() { } // hack to prevent duck typing
}

/** An instance of a Response card in game */
export class ResponseCardInGame extends CardInGame {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  response() { } // hack to prevent duck typing
}

export type PlayerRole = "player" | "spectator";

export type TurnPhase = "new" | "answering" | "reading" | "judging" | "complete";

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