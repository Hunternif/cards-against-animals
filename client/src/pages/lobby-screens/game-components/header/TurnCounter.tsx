import { ReactNode } from "react";
import { IconStarInline } from "../../../../components/Icons";
import { assertExhaustive } from "@shared/utils";
import { useGameContext } from "../GameContext";

/** Shows current turn number and total turns. */
export function TurnCounter() {
  const { lobby, turn } = useGameContext();
  let total: ReactNode = "";
  switch (lobby.settings.play_until) {
    case "forever":
      total = " / ∞";
      break;
    case "max_turns":
    case "max_turns_per_person":
      total = ` / ${lobby.settings.max_turns}`;
      break;
    case "max_score":
      total = <> – until {lobby.settings.max_score}<IconStarInline /></>;
      break;
    default:
      assertExhaustive(lobby.settings.play_until);
  }
  return <span className="menu-turn-ordinal">Turn {turn.ordinal}{total}</span>;
}