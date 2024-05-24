import { User } from "firebase/auth";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { ErrorContext } from "../../components/ErrorContext";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { FillLayout } from "../../components/layout/FillLayout";
import {
  useAllPlayerResponses,
  useAllTurnPrompts,
  useLastTurn,
  usePlayerDiscard,
  usePlayerHand
} from "../../model/turn-api";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  ResponseCardInGame,
  ResponseCardInHand
} from "../../shared/types";
import { CardReadingScreen } from "./CardReadingScreen";
import { JudgeAwaitResponsesScreen } from "./JudgeAwaitResponsesScreen";
import { JudgePickPromptScreen } from "./JudgePickPromptScreen";
import { PlayerAnsweringScreen } from "./PlayerAnsweringScreen";
import { WinnerScreen } from "./WinnerScreen";
import { GameContext, GameContextState } from "./game-components/GameContext";
import { GameMenu } from "./game-components/GameMenu";

interface ScreenProps {
  lobby: GameLobby,
  user: User,
  players: PlayerInLobby[],
}

const gameContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
}

export function GameScreen({ lobby, user, players }: ScreenProps) {
  const [turn, loadingTurn, error] = useLastTurn(lobby);
  const { setError } = useContext(ErrorContext);
  useEffect(() => {
    if (error) setError(error);
  }, [error, setError]);

  return (
    <FillLayout style={gameContainerStyle}
      className="game-screen miniscrollbar miniscrollbar-light">
      {(!turn) ? (
        <LoadingSpinner delay text="Waiting for next turn..." />
      ) : (
        <TurnScreen turn={turn} lobby={lobby} user={user} players={players} />
      )}
    </FillLayout>
  );
}

interface PreTurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  players: PlayerInLobby[],
}

function TurnScreen({ lobby, turn, user, players }: PreTurnProps) {
  const [prompts, loadingPrompts, error] = useAllTurnPrompts(lobby, turn);
  const [responses, loadingResponses, error2] = useAllPlayerResponses(lobby, turn);
  const [playerDiscard, loadingDiscard, error3] = usePlayerDiscard(lobby, turn, user.uid);
  const [newHand, loadingHand, error4] = usePlayerHand(lobby, turn.id, user.uid);

  // Remember hand from the previous turn:
  const [prevHand, setPrevHand] = useState<ResponseCardInHand[]>([]);
  if (newHand && prevHand != newHand) {
    setPrevHand(newHand);
  }
  const hand = newHand ?? prevHand;

  const judge = players.find((p) => p.uid === turn.judge_uid);
  const player = players.find((p) => p.uid === user.uid);
  const isJudge = judge?.uid === user.uid;
  const isSpectator = player?.role === "spectator";
  const isCreator = lobby.creator_uid === user.uid;
  const activePlayers = players.filter((p) =>
    p.role === "player" && p.status === "online");
  const lobbyControl = lobby.settings.lobby_control;
  const canControlLobby = lobbyControl === "anyone" ||
    lobbyControl === "players" && player?.role === "player" ||
    lobbyControl === "czar" && isJudge ||
    lobbyControl === "creator" && isCreator;

  const { setError } = useContext(ErrorContext);
  useEffect(() => {
    if (error || error2 || error3 || error4)
      setError(error || error2 || error3 || error4);
  }, [error, error2, error3, error4, setError]);

  if (!player) {
    setError("Current player is not in lobby");
    return <></>;
  }
  if (!judge) {
    setError("No judge");
    return <></>;
  }

  const gameState: GameContextState = {
    user, lobby, players, activePlayers, player, isSpectator, isJudge, isCreator,
    turn, hand, prompt: prompts.at(0), judge, responses, playerDiscard,
    canControlLobby,
  };

  return (
    <GameContext.Provider value={gameState}>
      <div className={`game-bg phase-${turn.phase}`} />
      <GameMenu />
      {isJudge ? <JudgeScreen turn={turn} /> :
        isSpectator ? <SpectatorScreen turn={turn} /> :
          <PlayerScreen turn={turn} />}
    </GameContext.Provider >
  );
}

interface TurnProps {
  turn: GameTurn,
}

function JudgeScreen({ turn }: TurnProps) {
  switch (turn.phase) {
    case "new": return <JudgePickPromptScreen />;
    case "answering": return <JudgeAwaitResponsesScreen />;
    case "reading": return <CardReadingScreen />;
    case "complete": return <WinnerScreen />;
  }
}

function PlayerScreen({ turn }: TurnProps) {
  switch (turn.phase) {
    case "new":
    case "answering": return <PlayerAnsweringScreen />;
    case "reading": return <CardReadingScreen />;
    case "complete": return <WinnerScreen />;
  }
}

function SpectatorScreen({ turn }: TurnProps) {
  switch (turn.phase) {
    case "new":
    case "answering": return <JudgeAwaitResponsesScreen />;
    case "reading": return <CardReadingScreen />;
    case "complete": return <WinnerScreen />;
  }
}

/** Compares 2 hands by card ids */
function isHandEqual(hand1: ResponseCardInGame[], hand2: ResponseCardInGame[]): boolean {
  if (hand1.length !== hand2.length) return false;
  for (let i = 0; i < hand1.length; i++) {
    if (hand1[i].id !== hand2[i].id) return false;
  }
  return true;
}