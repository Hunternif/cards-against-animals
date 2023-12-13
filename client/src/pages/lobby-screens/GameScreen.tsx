import { User } from "firebase/auth";
import { CSSProperties, useState } from "react";
import { PromptCard, ResponseCard } from "../../components/Cards";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { LoadingSpinner } from "../../components/utils";
import { submitPlayerResponse, useLastTurn, usePlayerData } from "../../model/turn-api";
import { GameLobby, GameTurn, ResponseCardInGame } from "../../shared/types";
import { FillLayout } from "../../components/layout/FillLayout";
import { GameButton } from "../../components/Buttons";

interface ScreenProps {
  lobby: GameLobby,
  user: User,
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "1em",
  padding: "1.5em",
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
}
const midRowStyle: CSSProperties = {}
const botRowStyle: CSSProperties = {
  justifyContent: "center",
}

export function GameScreen({ lobby, user }: ScreenProps) {
  const [turn, loading] = useLastTurn(lobby.id);
  if (!turn || loading) return <LoadingSpinner text="Waiting for next turn..." />;
  // if (!turn) throw new Error("No turn");
  return <TurnScreen turn={turn} lobby={lobby} user={user} />;
}

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

function TurnScreen({ lobby, turn, user }: TurnProps) {
  const [data] = usePlayerData(lobby, turn, user.uid);
  //TODO check if already submitted.
  // Set of card ids:
  const [selectedCards, setSelectedCards] = useState<ResponseCardInGame[]>([]);
  function selectCard(card: ResponseCardInGame) {
    const newSelection = selectedCards.slice();
    // Don't select more than required:
    while (newSelection.length >= turn.prompt.pick) {
      newSelection.pop();
    }
    newSelection.push(card);
    setSelectedCards(newSelection);
  }
  function deselectCard(cardID: ResponseCardInGame) {
    const newSelection = selectedCards.slice();
    const index = newSelection.indexOf(cardID);
    if (index > -1) {
      newSelection.splice(index, 1);
      setSelectedCards(newSelection);
    }
  }
  return (
    <FillLayout className="game-screen miniscrollbar miniscrollbar-light"
      style={{ overflowY: "auto", }}>
      <CenteredLayout style={containerStyle}>
        <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
          <PromptCard card={turn.prompt} />
        </div>
        <div className="game-mid-row" style={{ ...rowStyle, ...midRowStyle }}>
          {data && <ControlRow lobby={lobby} turn={turn} userID={user.uid}
            userName={data.player_name} selection={selectedCards} />}
        </div>
        <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
          {data && data.hand.map((card) =>
            <ResponseCard key={card.id} card={card}
              selectable={true}
              selectedIndex={selectedCards.indexOf(card)}
              showIndex={turn.prompt.pick > 1}
              onToggle={(selected) => {
                if (selected) selectCard(card);
                else deselectCard(card);
              }} />
          )}
        </div>
      </CenteredLayout>
    </FillLayout>
  );
}

interface ControlProps {
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
  userName: string,
  selection: ResponseCardInGame[], // card IDs
}

const buttonAlignedStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  height: "3rem",
}

function ControlRow({ lobby, turn, userID, userName, selection }: ControlProps) {
  const picked = selection.length;
  const total = turn.prompt.pick;
  const ready = picked >= total;
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  if (error) throw error;
  function handleClick() {
    setSubmitted(true);
    submitPlayerResponse(lobby, turn, userID, userName, selection)
      .catch((e) => setError(e));
  }
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      height: "4em",
      width: "100%",
    }}>
      {submitted ? (
        // Text displayed in place of button:
        <div style={buttonAlignedStyle} className="pre-submit-text">
          Submitted!
        </div>
      ) :
        ready ? (<GameButton accent onClick={handleClick}>Submit</GameButton>) : (
          // Text displayed in place of button:
          <div style={buttonAlignedStyle} className="pre-submit-text">
            Picked {picked} out of {total}
          </div>
        )}
    </div>
  );
}