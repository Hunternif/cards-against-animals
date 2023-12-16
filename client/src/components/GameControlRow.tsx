import { CSSProperties, useContext, useState } from "react";
import { Spinner } from "react-bootstrap";
import { submitPlayerResponse } from "../model/turn-api";
import { GameLobby, GameTurn, ResponseCardInGame } from "../shared/types";
import { GameButton } from "./Buttons";
import { ErrorContext } from "./ErrorContext";

interface ControlProps {
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
  userName: string,
  selection: ResponseCardInGame[], // card IDs
  submitted?: boolean,
}

const buttonAlignedStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  height: "3rem",
}

export function GameControlRow(
  { lobby, turn, userID, userName, selection, submitted }: ControlProps
) {
  const picked = selection.length;
  const total = turn.prompt?.pick ?? 1;
  const ready = turn.prompt && picked >= total;
  const [submitting, setSubmitting] = useState(false);
  const { setError } = useContext(ErrorContext);
  function handleClick() {
    setSubmitting(true);
    submitPlayerResponse(lobby, turn, userID, userName, selection)
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
        <div style={buttonAlignedStyle} className="pre-submit-text">
          Submitted!
        </div>
      ) :
        ready ? (<GameButton accent onClick={handleClick} disabled={submitting}
          icon={submitting && <Spinner size="sm" />}>
          Submit
        </GameButton>) : (
          // Text displayed in place of button:
          <div style={buttonAlignedStyle} className="pre-submit-text">
            {turn.prompt ? `Picked ${picked} out of ${total}` : "Waiting for prompt..."}
          </div>
        )}
    </div>
  );
}