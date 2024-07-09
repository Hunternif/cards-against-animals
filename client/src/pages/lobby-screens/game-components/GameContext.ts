import { User } from "firebase/auth";
import { createContext, useContext } from "react";
import {
  GameLobby,
  GameTurn,
  PlayerGameState,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInHand
} from "../../../shared/types";

/** State of the game in progress. */
export interface GameContextState {
  // Present throughout the game:
  user: User,
  lobby: GameLobby,
  players: PlayerInLobby[],
  /** Players who are currently active, i.e. excluding spectators,
   * people who left, who were kicked, etc. */
  activePlayers: PlayerInLobby[],
  /** Current player */
  player: PlayerInLobby,
  /** Current player's game state */
  playerState: PlayerGameState,
  /** Is current player a spectator? */
  isSpectator: boolean,
  /** Is current player the lobby creator? */
  isCreator: boolean,

  // Changes each turn:
  turn: GameTurn,
  /** Current player's hand. */
  hand: ResponseCardInHand[],
  prompt?: PromptCardInGame,
  judge: PlayerInLobby,
  /** Is current player this turn's judge? */
  isJudge: boolean,
  /** Does current player have the power to control lobby settings? */
  canControlLobby: boolean,
  /** Responses submitted by all players this turn. */
  responses: PlayerResponse[],
}

export const GameContext = createContext<GameContextState | undefined>(
  undefined
);

/**
 * Get current game state.
 * From https://stackoverflow.com/a/69735347/1093712
 */
export const useGameContext = () => {
  const gameContext = useContext(GameContext);
  if (!gameContext)
    throw new Error(
      'No GameContext.Provider found when calling useGameContext.'
    );
  return gameContext;
};