import { CSSProperties } from "react";
import { Col, Dropdown, Form, FormGroup, Row } from "react-bootstrap";
import { GameLobby } from "../shared/types";

interface Props {
  lobby: GameLobby,
  readOnly?: boolean,
}

const formStyle: CSSProperties = {
  width: "100%",
  padding: "1em 2em",
}

export function LobbySettings({ lobby, readOnly }: Props) {
  return (
    <Form style={formStyle}>
      <FormGroup as={Row}>
        <Form.Label column xs="6">Play until</Form.Label>
        <Col xs="6">
          <Dropdown>
            <Dropdown.Toggle variant="secondary" className="light-button"
              disabled={readOnly}>
              Forever
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item>X turns</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </FormGroup>
    </Form>
  );
}