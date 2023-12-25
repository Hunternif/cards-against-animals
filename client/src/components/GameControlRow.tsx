import { useContext } from "react";
import {
  GameTurn,
  PlayerDataInTurn,
  ResponseCardInGame
} from "../shared/types";
import { ErrorContext } from "./ErrorContext";

interface ControlProps {
  turn: GameTurn,
  data?: PlayerDataInTurn,
  selection: ResponseCardInGame[],
  submitted?: boolean,
}

export function GameControlRow(
  { turn, data, selection, submitted }: ControlProps
) {
  const picked = selection.length;
  const total = turn.prompt?.pick ?? 1;
  const { setError } = useContext(ErrorContext);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      width: "100%",
    }}>
      <span className="light" style={{ padding: "0.5rem 0" }}>
        {!data ? (
          // Assume we just joined the game in the middle of it:
          "Wait for next turn"
        ) : (
          submitted ? "Submitted!" : turn.prompt ? (
            `Picked ${picked} out of ${total}`
          ) : "Waiting for prompt..."
        )}
      </span>
    </div>
  );
}