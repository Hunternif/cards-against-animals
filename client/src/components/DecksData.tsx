
import { useCollection } from "react-firebase-hooks/firestore";
import { decksRef, lobbiesRef } from "../firebase";

export function DecksData() {
  const [decks] = useCollection(decksRef);

  return <p className="data-section">
    <h2>Decks</h2>
    {decks && decks.docs.map((doc) => {
      const deck = doc.data();
      return <div key={doc.id}>
        <h4>Deck "{deck.title}"</h4>
        <ul>
          <p className="data-subsection">
            <h5>Questions:</h5>
            <ul>
              {deck.questions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </p>
          <p className="data-subsection">
            <h5>Answers:</h5>
            <ul>
              {deck.answers.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </p>
        </ul>
      </div>
    })}
  </p>;
}