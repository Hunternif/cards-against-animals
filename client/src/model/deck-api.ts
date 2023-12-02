import { doc, getDoc, setDoc } from "firebase/firestore";
import { decksRef } from "../firebase";
import { Deck } from "./types";

export function parseDeck(
  title: string,
  questionsList: string,
  answerList: string,
): Deck {
  const deck = new Deck(title);
  deck.questions = questionsList.split("\n")
    .map((val) => val.trim())
    .filter((val) => val != "");
    deck.answers = answerList.split("\n")
    .map((val) => val.trim())
    .filter((val) => val != "");
  return deck;
}

export async function uploadDeck(deck: Deck) {
  const docRef = doc(decksRef, deck.title);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    throw new Error(`Deck ${deck.title} already exists`);
  }
  await setDoc(docRef, deck);
}
