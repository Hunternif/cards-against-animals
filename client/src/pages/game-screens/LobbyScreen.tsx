import { useDocumentData } from "react-firebase-hooks/firestore";
import { useLoaderData } from "react-router-dom";
import { lobbiesRef } from "../../firebase";
import { DocumentReference, doc } from "firebase/firestore";
import { GameLobby } from "../../model/types";
import { LoadingSpinner } from "../../components/utils";
import { CenteredLayout } from "../../components/layout/CenteredLayout";

interface LoaderParams {
  params: any
}

export function lobbyLoader({ params }: LoaderParams): DocumentReference<GameLobby> {
  const lobbyID = params['lobbyID'] as string;
  return doc(lobbiesRef, lobbyID);
}

export function LobbyScreen() {
  const lobbyRef = useLoaderData() as DocumentReference<GameLobby>;
  const [lobby, loading] = useDocumentData(lobbyRef);
  if (loading) return <LoadingSpinner/>;
  if (!loading && !lobby) throw new Error(`Lobby not found: ${lobbyRef.id}`);
  return <CenteredLayout>
    {lobby && <h2>Your lobby: {lobby.id}</h2>}
  </CenteredLayout>;
}