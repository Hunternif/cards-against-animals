import { User } from "@firebase/auth";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { CardPromptWithCzar } from "../../components/CardPrompt";
import { ErrorContext } from "../../components/ErrorContext";
import { GameHand } from "../../components/GameHand";
import { GameMiniResponses } from "../../components/GameMiniResponses";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { logInteraction } from "../../components/utils";
import {
  cancelPlayerResponse,
  submitPlayerResponse,
  usePlayerData,
  usePlayerHand
} from "../../model/turn-api";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PlayerResponse,
  ResponseCardInGame
} from "../../shared/types";
import { GameControlRow } from "../../components/GameControlRow";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  judge?: PlayerInLobby,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "1em",
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
  padding: "1em",
}
const midRowStyle: CSSProperties = {
  justifyContent: "center",
  height: "auto",
}
const botRowStyle: CSSProperties = {
  justifyContent: "center",
}
const miniResponsesContainerStyle: CSSProperties = {
  flex: "1 1 auto",
  overflow: "hidden",
  maxHeight: "20rem",
  marginTop: "2em",
}

export function PlayerAnsweringScreen(
  { lobby, turn, user, judge, players, responses }: TurnProps
) {
  const [data] = usePlayerData(lobby, turn, user.uid);
  const [hand] = usePlayerHand(lobby, turn, user.uid);
  const response = responses.find((r) => r.player_uid === user.uid);
  const submitted = response !== undefined;
  const [selectedCards, setSelectedCards] =
    useState<ResponseCardInGame[]>(response?.cards?.slice() ?? []);
  const [discardedCards, setDiscardedCards] = useState<ResponseCardInGame[]>([]);
  const [discarding, setDiscarding] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function handleSelect(cards: ResponseCardInGame[]) {
    setSelectedCards(cards);
    if (!data) return;
    if (cards.length === turn.prompt?.pick) {
      logInteraction(lobby.id, { played: cards });
      await submitPlayerResponse(lobby, turn, data, cards)
        .catch((e) => setError(e));
    } else {
      await cancelPlayerResponse(lobby, turn, data)
        .catch((e) => setError(e));
    }
  }

  const [loggedView, setLoggedView] = useState(false);
  useEffect(() => {
    if (hand && !loggedView) {
      setLoggedView(true);
      logInteraction(lobby.id, { viewed: hand });
    }
  }, [hand, turn.id]);

  function handleDiscard() {
    //TODO call API to discard cards.
    setDiscarding(false);
  }

  return <>
    {hand ? <CenteredLayout style={containerStyle}>
      <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
        <CardPromptWithCzar card={turn.prompt} judge={judge} />
        {turn.prompt &&
          <div style={miniResponsesContainerStyle}>
            <GameMiniResponses
              lobby={lobby}
              turn={turn}
              players={players}
              responses={responses}
            />
          </div>
        }
      </div>
      <div className="game-mid-row" style={{ ...rowStyle, ...midRowStyle }}>
        <GameControlRow
          turn={turn}
          data={data}
          selection={selectedCards}
          submitted={submitted}
          discarding={discarding}
          onToggleDiscard={(enabled) => setDiscarding(enabled)}
          onSubmitDiscard={handleDiscard}
        />
      </div>
      <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
        <GameHand
          lobby={lobby}
          turn={turn}
          user={user}
          pick={turn.prompt?.pick ?? 0}
          hand={hand}
          response={response}
          selectedCards={selectedCards}
          setSelectedCards={handleSelect}
          discarding={discarding}
          discardedCards={discardedCards}
          setDiscardedCards={setDiscardedCards}
        />
      </div>
    </CenteredLayout> :
      <LoadingSpinner delay text="Loading player data..." />}
  </>;
}