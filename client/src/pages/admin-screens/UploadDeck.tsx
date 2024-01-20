import { useState } from "react";
import { Alert, Button, Col, Row } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { parseDeck, uploadDeck } from "../../model/deck-api";

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
        data.get('questions') as string,
        data.get('answers') as string,
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
  return <>
    <h2>Upload new deck</h2>
    {info && <Alert variant="light">{info}</Alert>}
    {error && <Alert variant="danger">{error.message}</Alert>}
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Form.Group as={Col}>
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" name="title" disabled={isUploading} />
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label>ID</Form.Label>
          <Form.Control type="text" name="id" disabled={isUploading} />
        </Form.Group>
      </Row>
      <Form.Group className="mb-3">
        <Form.Label>Questions</Form.Label>
        <Form.Control as="textarea" name="questions" rows={10} disabled={isUploading} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Answers</Form.Label>
        <Form.Control as="textarea" name="answers" rows={10} disabled={isUploading} />
      </Form.Group>
      <Button type="submit" disabled={isUploading}>
        {isUploading ? "Submitting..." : "Submit"}
      </Button>
    </Form>
  </>;
}