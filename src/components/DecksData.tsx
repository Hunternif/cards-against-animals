
import { useCollection } from "react-firebase-hooks/firestore";
import { decksRef, lobbiesRef } from "../firebase";

export function DecksData() {
  const [decks] = useCollection(decksRef);

  return <div className="data-section">
    <h2>Decks</h2>
    {decks && decks.docs.map((doc) => {
      const deck = doc.data();
      return <div key={doc.id}>
        <h3>{deck.name}</h3>
        <ul>
          <div className="data-subsection">
            <h4>Questions:</h4>
            <ul>
              {deck.questions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
          <div className="data-subsection">
            <h4>Answers:</h4>
            <ul>
              {deck.answers.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        </ul>
      </div>
    })}
  </div>;
}