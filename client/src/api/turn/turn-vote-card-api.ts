import { collection, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { voteConverter } from "../../shared/firestore-converters";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PromptCardInGame,
  ResponseCardInGame,
  Vote,
  VoteChoice,
} from "../../shared/types";
import { getTurnRef, updateHandCard } from "./turn-repository";

///////////////////////////////////////////////////////////////////////////////
//
//  Repository & API for upvoting/downvoting cards in a game.
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference of votes for a prompt in turn. */
function getPromptVotesRef(
  lobbyID: string,
  turnID: string,
  promptCardID: string,
) {
  const turnRef = getTurnRef(lobbyID, turnID);
  return collection(turnRef, "prompts", promptCardID, "votes").withConverter(
    voteConverter,
  );
}

/** Set card as downvoted. This will be copied to all following turns,
 * and recorded at the end of the game. */
export async function toggleDownvoteCard(
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
  card: ResponseCardInGame,
  downvoted: boolean,
) {
  card.downvoted = downvoted;
  await updateHandCard(lobby.id, turn.id, userID, card);
}

/** Create/delete a "yes"/"no" vote for the given prompt from the current player.
 * "Yes" means like, "no" means dislike, null removes vote. */
export async function votePrompt(
  lobby: GameLobby,
  turn: GameTurn,
  prompt: PromptCardInGame,
  currentPlayer: PlayerInLobby,
  choice?: VoteChoice,
) {
  const votesRef = getPromptVotesRef(lobby.id, turn.id, prompt.id);
  const userVoteRef = doc(votesRef, currentPlayer.uid);
  const userVoteSnap = await getDoc(userVoteRef);
  if (choice) {
    await setDoc(
      userVoteRef,
      new Vote(currentPlayer.uid, currentPlayer.name, choice),
    );
  } else {
    if (userVoteSnap.exists()) {
      await deleteDoc(userVoteRef);
    }
  }
}
