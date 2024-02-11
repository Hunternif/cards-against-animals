import { FirestoreError, Query, QuerySnapshot } from "firebase/firestore";
import { EffectCallback, useEffect } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { logInteractionFun } from "../firebase";
import { CardInGame, PromptCardInGame, ResponseCardInGame } from "../shared/types";

export function useEffectOnce(effect: EffectCallback) {
  useEffect(effect, []);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Logs impressions and interactions with cards */
export async function logInteraction(lobbyID: string,
  interaction: {
    viewed?: CardInGame[], played?: CardInGame[],
    discarded?: CardInGame[], won?: ResponseCardInGame[],
  },
) {
  const data = {
    lobby_id: lobbyID,
    viewed_prompts: new Array<PromptCardInGame>(),
    played_prompts: new Array<PromptCardInGame>(),
    discarded_prompts: new Array<PromptCardInGame>(),
    viewed_responses: new Array<ResponseCardInGame>(),
    played_responses: new Array<ResponseCardInGame>(),
    discarded_responses: new Array<ResponseCardInGame>(),
    won_responses: new Array<ResponseCardInGame>(),
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
  for (const card of interaction.discarded || []) {
    if (card instanceof PromptCardInGame) {
      data.discarded_prompts.push(card);
    } else if (card instanceof ResponseCardInGame) {
      data.discarded_responses.push(card);
    }
  }
  for (const card of interaction.won || []) {
    data.won_responses.push(card);
  }
  await logInteractionFun(data);
}

export type FirestoreCollectionDataHook<T> = [
  value: T[] | undefined,
  loading: boolean,
  error?: FirestoreError,
  snapshot?: QuerySnapshot<T>,
];
export type FirestoreCollectionDataHookNullSafe<T> = [
  value: T[],
  loading: boolean,
  error?: FirestoreError,
  snapshot?: QuerySnapshot<T>,
];

/** Same as Firestore useCollectionData, but the returned collection is non-null. */
export function useCollectionDataNonNull<T>(query?: Query<T>):
  FirestoreCollectionDataHookNullSafe<T> {
  const [data, loading, error, snapshot] = useCollectionData(query);
  return [data || [], loading, error, snapshot];
}