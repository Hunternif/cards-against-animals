import { EffectCallback, useEffect, useState } from "react";
import { CardInGame, PromptCardInGame, ResponseCardInGame } from "../shared/types";
import { logInteractionFun } from "../firebase";

export function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []);
}

/** Returns the given value after a delay, e.g. to prevent flash of loading. */
export function useDelay<T>(value: T, delayMs: number = 1000): T | null {
  const [show, setShow] = useState(false);
  let timeout: NodeJS.Timeout | null = null;

  function reset() {
    if (timeout) {
      setShow(false);
      clearTimeout(timeout);
      timeout = null;
    }
  }
  useEffect(() => {
    reset();
    timeout = setTimeout(() => {
      setShow(true);
    }, delayMs)
    return reset;
  }, [timeout, delayMs, value]);

  if (!show) return null;
  else return value;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Logs impressions and interactions with cards */
export async function logInteraction(lobbyID: string,
  interaction: { viewed?: CardInGame[], played?: CardInGame[] },
) {
  const data = {
    lobby_id: lobbyID,
    viewed_prompts: new Array<PromptCardInGame>(),
    played_prompts: new Array<PromptCardInGame>(),
    viewed_responses: new Array<ResponseCardInGame>(),
    played_responses: new Array<ResponseCardInGame>(),
  };
  for (const card of interaction.viewed || []) {
    if (card instanceof PromptCardInGame) {
      data.viewed_prompts.push(card);
    } else if (card instanceof ResponseCardInGame) {
      data.viewed_responses.push(card);
    }
  }
  for (const card of interaction.played || []) {
    if (card instanceof PromptCardInGame) {
      data.played_prompts.push(card);
    } else if (card instanceof ResponseCardInGame) {
      data.played_responses.push(card);
    }
  }
  await logInteractionFun(data);
}