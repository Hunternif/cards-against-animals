import { CSSProperties, useContext, useState } from "react";
import { Spinner } from "react-bootstrap";
import { submitPlayerResponse } from "../model/turn-api";
import { GameLobby, GameTurn, PlayerDataInTurn, PlayerInLobby, ResponseCardInGame } from "../shared/types";
import { GameButton } from "./Buttons";
import { ErrorContext } from "./ErrorContext";
import { logInteraction } from "./utils";

interface ControlProps {
  lobby: GameLobby,
  turn: GameTurn,
  data: PlayerDataInTurn,
  selection: ResponseCardInGame[], // card IDs
  submitted?: boolean,
  players: PlayerInLobby[],
}

const buttonAlignedStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  height: "3rem",
}

export function GameControlRow(
  { lobby, turn, data, selection, submitted, players }: ControlProps
) {
  const picked = selection.length;
  const total = turn.prompt?.pick ?? 1;
  const ready = turn.prompt && picked >= total;
  const judgeName = players.find((p) => p.uid === turn.judge_uid)?.name;

  const [submitting, setSubmitting] = useState(false);
  const { setError } = useContext(ErrorContext);

  function handleClick() {
    logInteraction(lobby.id, {viewed: data.hand, played: selection});
    setSubmitting(true);
    submitPlayerResponse(lobby, turn, data, selection)
      .then(() => setSubmitting(false))
      .catch((e) => {
        setError(e);
        setSubmitting(false);
      });
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
        <div style={buttonAlignedStyle} className="light">
          Submitted!
        </div>
      ) :
        ready ? (<GameButton accent onClick={handleClick} disabled={submitting}
          icon={submitting && <Spinner size="sm" />}>
          Submit
        </GameButton>) : (
          // Text displayed in place of button:
          <div style={buttonAlignedStyle} className="light">
            {turn.prompt ? `Picked ${picked} out of ${total}` : (
              <span>
                <i>{judgeName}</i> is Card Czar. Waiting for prompt...
              </span>)}
          </div>
        )}
    </div>
  );
}