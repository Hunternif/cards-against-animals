import { doc, getDoc } from "firebase/firestore";
import { usersRef } from "../firebase";
import { CAAUser } from "../shared/types";

/** Finds user data by ID */
export async function getCAAUser(userID: string): Promise<CAAUser | null> {
  return (await getDoc(doc(usersRef, userID))).data() ?? null;
}