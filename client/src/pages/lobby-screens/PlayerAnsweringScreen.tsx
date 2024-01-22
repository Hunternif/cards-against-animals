import { User } from "@firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { CardPromptWithCzar } from "../../components/CardPrompt";
import { ErrorContext } from "../../components/ErrorContext";
import { GameControlRow } from "../../components/GameControlRow";
import { GameHand } from "../../components/GameHand";
import { GameMiniResponses } from "../../components/GameMiniResponses";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ResponseCount } from "../../components/ResponseCount";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { ScreenSizeSwitch } from "../../components/layout/ScreenSizeSwitch";
import {
  cancelPlayerResponse,
  discardCards,
  submitPlayerResponse,
  usePlayerData,
  usePlayerHand
} from "../../model/turn-api";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame
} from "../../shared/types";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  prompt?: PromptCardInGame,
  judge?: PlayerInLobby,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
  playerDiscard: ResponseCardInGame[],
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
};
const rowStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "row",
  flexBasis: 1,
  flexWrap: "wrap",
  gap: "1em",
};
const topRowStyle: CSSProperties = {
  justifyContent: "flex-start",
  flexWrap: "nowrap",
  paddingLeft: "1em",
  paddingRight: "1em",
}
const midRowStyle: CSSProperties = {
  justifyContent: "center",
  height: "auto",
}
const botRowStyle: CSSProperties = {
  justifyContent: "center",
  paddingTop: "0.5rem",
  paddingBottom: "1rem",
  paddingLeft: "1em",
  paddingRight: "1em",
}
const miniResponsesContainerStyle: CSSProperties = {
  flex: "1 1 auto",
  overflow: "hidden",
  maxHeight: "20rem",
  marginTop: "1em",
}

export function PlayerAnsweringScreen(
  { lobby, turn, user, prompt, judge, players, responses, playerDiscard }: TurnProps
) {
  const [data] = usePlayerData(lobby, turn, user.uid);
  const [hand] = usePlayerHand(lobby, turn, user.uid);
  const response = responses.find((r) => r.player_uid === user.uid);
  const submitted = response !== undefined;
  const [selectedCards, setSelectedCards] =
    useState<ResponseCardInGame[]>(response?.cards?.slice() ?? []);
  const [discardedCards, setDiscardedCards] =
    useState<ResponseCardInGame[]>(playerDiscard.slice());
  const [discarding, setDiscarding] = useState(false);
  const { setError } = useContext(ErrorContext);

  // Filter out spectators and the judge:
  const validPlayers = players.filter((p) =>
    p.role === "player" && p.status !== "left" && p.uid !== turn.judge_uid
  );
  const currentPlayer = players.find((p) => p.uid === user.uid);

  /** When cards are clicked for response. */
  async function handleSelect(cards: ResponseCardInGame[]) {
    setSelectedCards(cards);
    if (!data) return;
    if (cards.length === prompt?.pick) {
      await submitPlayerResponse(lobby, turn, data, cards)
        .catch((e) => setError(e));
    } else {
      await cancelPlayerResponse(lobby, turn, data)
        .catch((e) => setError(e));
    }
  }

  /** When discarding mode is turned on/off. */
  function toggleDiscard(on: boolean) {
    if (on) {
      setDiscarding(true);
    } else {
      setDiscarding(false);
      setDiscardedCards(playerDiscard);
    }
  }

  /** When new discarded cards are clicked, automatically update firestore. */
  async function handleDiscard(cards: ResponseCardInGame[]) {
    setDiscardedCards(cards);
    await discardCards(lobby, turn, user.uid, cards)
      .catch((e) => setError(e));
  }

  return <>
    {hand ? <CenteredLayout innerStyle={containerStyle}
      outerClassName="player-answering-screen"
      innerClassName="player-answering-container">
      <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
        <CardPromptWithCzar
          lobby={lobby} turn={turn}
          currentPlayer={currentPlayer}
          card={prompt} judge={judge} canVote />
        {prompt &&
          <ScreenSizeSwitch
            widthBreakpoint={480}
            smallScreen={
              <ResponseCount players={validPlayers} responses={responses} />
            }
            bigScreen={
              <div style={miniResponsesContainerStyle}>
                <GameMiniResponses
                  lobby={lobby}
                  turn={turn}
                  prompt={prompt}
                  players={validPlayers}
                  responses={responses}
                />
              </div>
            }
          />
        }
      </div>
      <div className="game-mid-row" style={{ ...rowStyle, ...midRowStyle }}>
        <GameControlRow
          turn={turn}
          prompt={prompt}
          data={data}
          selection={selectedCards}
          submitted={submitted}
          discarding={discarding}
          onToggleDiscard={toggleDiscard}
          discardedCards={discardedCards}
        />
      </div>
      <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
        <GameHand
          lobby={lobby}
          turn={turn}
          user={user}
          pick={prompt?.pick ?? 0}
          hand={hand}
          response={response}
          selectedCards={selectedCards}
          setSelectedCards={handleSelect}
          discarding={discarding}
          discardedCards={discardedCards}
          setDiscardedCards={handleDiscard}
        />
      </div>
    </CenteredLayout> :
      <LoadingSpinner delay text="Loading player data..." />}
  </>;
}