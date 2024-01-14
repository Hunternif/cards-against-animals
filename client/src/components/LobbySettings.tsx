import { CSSProperties, ChangeEvent, ReactNode, useContext } from "react";
import { updateLobby } from "../model/lobby-api";
import { GameLobby, PlayUntil } from "../shared/types";
import { ErrorContext } from "./ErrorContext";

interface Props {
  lobby: GameLobby,
  readOnly?: boolean,
}

const formStyle: CSSProperties = {
  width: "100%",
  padding: "1em 2em",
  // Display style is controlled in CSS with media query
  // display: "flex",
  // flexDirection: "column",
  gap: "0.25em",
}

const formRowStyle: CSSProperties = {
  // flex: "1 1 auto",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.75em",
  alignItems: "baseline",
}

const controlStyle: CSSProperties = {
  maxWidth: "12em",
}

export function LobbySettings(props: Props) {
  const playUntil = props.lobby.settings.play_until;
  return (
    <div style={formStyle} className="lobby-settings-container">
      <FormItem label="Play until" control={<EndControl {...props} />} />
      {/* Prevent another item appearing next to "play until": */}
      {playUntil === "forever" && <div style={{ width: "100%", marginTop: "-0.25em" }} />}
      {playUntil === "max_turns" && (
        <FormItem label="Number of turns" control={<MaxTurnsControl {...props} />} />
      )}
      {playUntil === "max_score" && (
        <FormItem label="Maximum score" control={<MaxScoreControl {...props} />} />
      )}
      <FormItem label="Cards per person" control={<CardsPerPersonControl {...props} />} />
    </div>
  );
}

// TODO: typed components select and number input controls.

function EndControl({ lobby, readOnly }: Props) {
  const { setError } = useContext(ErrorContext);
  const playUntil = lobby.settings.play_until;

  async function handleSelect(event: ChangeEvent<HTMLSelectElement>) {
    const newValue = event.target.value as PlayUntil;
    lobby.settings.play_until = newValue;
    await updateLobby(lobby).catch((e) => setError(e));
  }

  return (
    <select style={controlStyle} disabled={readOnly}
      value={playUntil} onChange={handleSelect}>
      <option value="forever">Forever</option>
      <option value="max_turns">X turns</option>
      <option value="max_score">X score</option>
    </select>
  );
}

function MaxTurnsControl({ lobby, readOnly }: Props) {
  const { setError } = useContext(ErrorContext);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = parseInt(event.target.value);
    lobby.settings.max_turns = newValue;
    await updateLobby(lobby).catch((e) => setError(e));
  }

  return (
    <input className="control" style={controlStyle} disabled={readOnly}
      type="number" min="1" max="99"
      value={lobby.settings.max_turns} onChange={handleChange} />
  );
}

function MaxScoreControl({ lobby, readOnly }: Props) {
  const { setError } = useContext(ErrorContext);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = parseInt(event.target.value);
    lobby.settings.max_score = newValue;
    await updateLobby(lobby).catch((e) => setError(e));
  }

  return (
    <input className="control" style={controlStyle} disabled={readOnly}
      type="number" min="1" max="99"
      value={lobby.settings.max_score} onChange={handleChange} />
  );
}

function CardsPerPersonControl({ lobby, readOnly }: Props) {
  const { setError } = useContext(ErrorContext);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = parseInt(event.target.value);
    lobby.settings.cards_per_person = newValue;
    await updateLobby(lobby).catch((e) => setError(e));
  }

  return (
    <input className="control" style={controlStyle} disabled={readOnly}
      type="number" min="2" max="99"
      value={lobby.settings.cards_per_person} onChange={handleChange} />
  );
}

interface ItemProps {
  label: string,
  control: ReactNode,
}

function FormItem({ label, control }: ItemProps) {
  return <div style={formRowStyle}>
    <span style={{ textAlign: "end" }}>{label}</span>
    {control}
  </div>;
}