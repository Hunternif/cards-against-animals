import { ChangeEvent, useRef, useState } from "react";
import { Alert, Button, Col, Row } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { useDIContext } from "../../di-context";
import { useEffectOnce } from "../../hooks/ui-hooks";
import { parseDeck } from "../../api/deck-parser";
import { Deck } from "../../shared/types";
import { AdminSubpage } from "./admin-components/AdminSubpage";
import { mergeDecks } from "../../api/deck-merger";

export function UploadDeck() {
  const { deckRepository } = useDIContext();
  const [isUploading, setUploading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [decks, setDecks] = useState<Array<Deck>>([]);
  const [targetDeck, setTargetDeck] = useState<Deck | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setInfo(null);
    setError(null);
    setUploading(true);
    try {
      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const deck = parseDeck(
        data.get('id') as string,
        data.get('title') as string,
        data.get('prompts') as string,
        data.get('responses') as string,
      );
      if (targetDeck) {
        const targetDeckFull = await deckRepository.downloadDeck(targetDeck.id);
        const mergedDeck = await mergeDecks(targetDeckFull, deck);
        await deckRepository.uploadDeck(mergedDeck);
        setInfo(`Merged into "${mergedDeck.title}"`);
      } else {
        await deckRepository.uploadNewDeck(deck);
        setInfo(`Deck "${deck.title}" uploaded`);
      }
      setUploading(false);
      form.reset();
    } catch (error: any) {
      setError(error);
      setUploading(false);
    }
  }

  useEffectOnce(() => {
    // Load decks:
    deckRepository.getDecks().then((decks) => setDecks(decks))
      .catch((e: any) => setError(e));
  });

  function handleSelectTarget(event: ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value;
    if (id === "") {
      setTargetDeck(null);
      setInputValues("", "");
    } else {
      const deck = decks.find((d) => d.id === id);
      if (deck) {
        setTargetDeck(deck);
        setInputValues(deck.id, deck.title);
      }
    }
  }

  /** Set values for id and title inputs. */
  function setInputValues(id: string, title: string) {
    // Note: this updates the HTML, but does not correctly set internal values
    // on the React form inputs. Can't use FormData after this!
    idRef.current?.setAttribute('value', id);
    titleRef.current?.setAttribute('value', title);
  }

  return <AdminSubpage title="Upload new deck">
    {info && <Alert variant="light">{info}</Alert>}
    {error && <Alert variant="danger">{error.message}</Alert>}
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Form.Group as={Col}>
          <Form.Label>Destination</Form.Label>
          <Form.Select name="targetDeck" onChange={handleSelectTarget}>
            <option value="">New deck...</option>
            {decks.map((deck) =>
              <option key={deck.id} value={deck.id}>{deck.title}</option>)
            }
          </Form.Select>
        </Form.Group>
        <Form.Group as={Col}>
        </Form.Group>
      </Row>
      <Row className="mb-3">
        <Form.Group as={Col}>
          <Form.Label>Title</Form.Label>
          <Form.Control ref={titleRef} type="text" name="title" required
            disabled={isUploading || targetDeck !== null}
            placeholder="My new deck" />
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label>ID</Form.Label>
          <Form.Control ref={idRef} type="text" name="id" required
            disabled={isUploading || targetDeck !== null}
            placeholder="my_deck_id" />
        </Form.Group>
      </Row>
      <Form.Group className="mb-3">
        <Form.Label>Prompts</Form.Label>
        <Form.Control as="textarea" name="prompts" rows={10} disabled={isUploading}
          style={{ fontFamily: "monospace" }}
          placeholder="Why did __ cross the road?
I like big __
..." />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Responses</Form.Label>
        <Form.Control as="textarea" name="responses" rows={10} disabled={isUploading}
          style={{ fontFamily: "monospace" }}
          placeholder="Chicken
Egg
Your mom
..."
        />
      </Form.Group>
      <Button type="submit" disabled={isUploading}>
        {isUploading ? "Submitting..." : "Submit"}
      </Button>
    </Form>
  </AdminSubpage>;
}