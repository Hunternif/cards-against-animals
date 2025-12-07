import { useState } from "react";
import { SelectInput } from "../../../components/FormControls";
import { PromptCardInGame } from "@shared/types";
import {
  haikuPrompt3,
  haikuPrompt4,
  haikuPrompt5,
  haikuPrompt6,
} from "../../../api/deck/deck-repository";

interface Props {
  onNewHaiku: (card: PromptCardInGame) => void;
}

type HaikuSize = "3" | "4" | "5" | "6";

const haikuMap = new Map<HaikuSize, PromptCardInGame>([
  ["3", haikuPrompt3],
  ["4", haikuPrompt4],
  ["5", haikuPrompt5],
  ["6", haikuPrompt6],
]);

export function HaikuSizeSelector({ onNewHaiku }: Props) {
  const [pick, setPick] = useState<HaikuSize>("3");

  function handlePick(value: HaikuSize) {
    setPick(value);
    const haiku = haikuMap.get(value);
    if (haiku) onNewHaiku(haiku);
  }

  return (
    <SelectInput
      small
      // secondary
      value={pick}
      onChange={handlePick}
      options={[
        ["3", "Pick 3"],
        ["4", "Pick 4"],
        ["5", "Pick 5"],
        ["6", "Pick 6"],
      ]}
    />
  );
}
