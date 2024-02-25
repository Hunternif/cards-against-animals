import { useState } from "react";
import { Alert, Button, Col, Row } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { parseDeck, uploadDeck } from "../../model/deck-api";
import { AdminSubpage } from "./admin-components/AdminSubpage";

export function UploadDeck() {
  const [isUploading, setUploading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
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
      await uploadDeck(deck);
      setInfo(`Deck "${deck.title}" uploaded`)
      setUploading(false);
      form.reset();
    } catch (error: any) {
      setError(error);
      setUploading(false);
    }
  }
  return <AdminSubpage title="Upload new deck">
    {info && <Alert variant="light">{info}</Alert>}
    {error && <Alert variant="danger">{error.message}</Alert>}
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Form.Group as={Col}>
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" name="title" disabled={isUploading} required
            placeholder="My new deck" />
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label>ID</Form.Label>
          <Form.Control type="text" name="id" disabled={isUploading} required
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