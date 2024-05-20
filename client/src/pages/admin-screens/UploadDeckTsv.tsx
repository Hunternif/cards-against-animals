import { ChangeEvent, useRef, useState } from "react";
import { Alert, Button, Col, Row } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { getDecks, loadDeck, mergeDecks, parseDeckTsv, uploadDeck, uploadNewDeck } from "../../model/deck-api";
import { AdminSubpage } from "./admin-components/AdminSubpage";
import { useEffectOnce } from "../../components/utils";
import { Deck } from "../../shared/types";

export function UploadDeckTsv() {
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
      const deck = parseDeckTsv(
        data.get('id') as string,
        data.get('title') as string,
        data.get('cardData') as string,
        data.get('tagData') as string,
      );
      if (targetDeck) {
        const targetDeckFull = await loadDeck(targetDeck.id);
        const mergedDeck = await mergeDecks(targetDeckFull, deck);
        await uploadDeck(mergedDeck);
        setInfo(`Merged into "${mergedDeck.title}"`);
      } else {
        await uploadNewDeck(deck);
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
    getDecks().then((decks) => setDecks(decks))
      .catch((e) => setError(e));
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

  return <AdminSubpage title="Upload new deck from TSV">
    {info && <Alert variant="light">{info}</Alert>}
    {error && <Alert variant="danger">{error.message}</Alert>}
    <p className="light">This is a special format for uploading cards with tags.</p>
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
        <Form.Label>Card data, tab-separated</Form.Label>
        <Form.Control as="textarea" name="cardData" rows={12} disabled={isUploading}
          style={{ fontFamily: "monospace" }}
          placeholder="Type     Text       tag1  tag2  ...
Prompt   Hello, __  tag1           
Response World            tag2     "
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Tag data, tab-separated</Form.Label>
        <Form.Control as="textarea" name="tagData" rows={6} disabled={isUploading}
          style={{ fontFamily: "monospace" }}
          placeholder="Tag     Description
tag1    My favorite tag
tag2    ...
..."
        />
      </Form.Group>
      <Button type="submit" disabled={isUploading}>
        {isUploading ? "Submitting..." : "Submit"}
      </Button>
    </Form>
  </AdminSubpage>;
}