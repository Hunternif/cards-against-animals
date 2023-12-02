import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth, useFetchCAAUser } from "./firebase";
import Form from "react-bootstrap/Form";
import { Alert, Button, Container } from "react-bootstrap";
import { parseDeck, uploadDeck } from "./model/deck-api";
import { useState } from "react";

function LogInBox() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(firebaseAuth, provider);
  }
  return <button onClick={signInWithGoogle}>Sign in with Google</button>;
}

interface UserProps {
  user: User;
}

function LoggedInView({ user }: UserProps) {
  const [caaUser, loading] = useFetchCAAUser(user.email ?? "invalid");
  const isAdmin = caaUser?.is_admin ?? false;
  return (
    <Container>
      <div className='admin-header'>
        <span>Hello, {user.displayName}!</span>
        <button onClick={() => firebaseAuth.signOut()}>Sign out</button>
      </div>
      {!loading && (isAdmin ? <AdminContent /> : <div>Access denied</div>)}
    </Container>
  );
}

function AdminContent() {
  const [error, setError] = useState<Error | null>(null);
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const deck = parseDeck(
        data.get('title') as string,
        data.get('questions') as string,
        data.get('answers') as string,
      );
      await uploadDeck(deck);
      form.reset();
    } catch (error: any) {
      setError(error);
    }
  }
  return <>
    <h2>Upload new deck</h2>
    {error && <Alert variant="danger">{error.message}</Alert>}
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control type="text" name="title" />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Questions</Form.Label>
        <Form.Control as="textarea" name="questions" rows={10} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Answers</Form.Label>
        <Form.Control as="textarea" name="answers" rows={10} />
      </Form.Group>
      <Button type="submit">Submit</Button>
    </Form>
  </>;
}

function AdminPage() {
  const [user] = useAuthState(firebaseAuth);
  return user ? <LoggedInView user={user} /> : <LogInBox />;
}

export default AdminPage