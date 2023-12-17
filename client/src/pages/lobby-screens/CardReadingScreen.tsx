import { User } from "@firebase/auth";
import { CSSProperties } from "react";
import { PromptCard } from "../../components/Cards";
import { ResponseReading } from "../../components/ResponseReading";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { useAllPlayerResponses } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerResponse, ResponseCardInGame } from "../../shared/types";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

const topRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  gap: "1rem",
}

const midRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  alignItems: "center",
  gap: "1rem",
}

// const dummyCard = new ResponseCardInGame("deck1_01", "deck1", "01", 123, "Poop", 0);
// const dummyResponse = new PlayerResponse("01", "Dummy", [dummyCard], 123, false);
// const dummyResponses = new Array<PlayerResponse>(10).fill(dummyResponse, 0, 10);

export function CardReadingScreen({ lobby, turn, user }: TurnProps) {
  // const responses = dummyResponses;
  const [responses] = useAllPlayerResponses(lobby, turn);
  const isJudge = turn.judge_uid === user.uid;

  return <CenteredLayout>
    <div className={`game-bg phase-${turn.phase}`} />
    <div style={topRowStyle}>
      {isJudge && <h2>Reveal answers</h2>}
    </div>
    <div style={midRowStyle}>
      <PromptCard card={turn.prompt} />
      {responses && responses.sort((r) => r.random_index).map((r) =>
        <ResponseReading
          key={r.player_uid}
          response={r}
          canReveal={isJudge}
        />
      )}
    </div>
  </CenteredLayout>;
}
