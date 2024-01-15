import { CSSProperties, ReactNode } from "react";
import { updateLobby } from "../model/lobby-api";
import { GameLobby } from "../shared/types";
import { NumberInput, SelectInput, ToggleInput } from "./FormControls";

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
  alignItems: "center",
  minHeight: "2.5em",
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
      <FormItem label="New cards first" control={<NewCardsFirstControl {...props} />} />
    </div>
  );
}

function EndControl({ lobby, readOnly }: Props) {
  return <SelectInput disabled={readOnly}
    value={lobby.settings.play_until}
    onChange={async (newValue) => {
      lobby.settings.play_until = newValue;
      await updateLobby(lobby);
    }}
    options={[
      ["forever", "Forever"],
      ["max_turns", "X turns"],
      ["max_score", "X score"],
    ]}
  />;
}

function MaxTurnsControl({ lobby, readOnly }: Props) {
  return <NumberInput min={1} max={99} disabled={readOnly}
    value={lobby.settings.max_turns}
    onChange={async (newValue) => {
      lobby.settings.max_turns = newValue;
      await updateLobby(lobby);
    }}
  />;
}

function MaxScoreControl({ lobby, readOnly }: Props) {
  return <NumberInput min={1} max={99} disabled={readOnly}
    value={lobby.settings.max_score}
    onChange={async (newValue) => {
      lobby.settings.max_score = newValue;
      await updateLobby(lobby);
    }}
  />;
}

function CardsPerPersonControl({ lobby, readOnly }: Props) {
  return <NumberInput min={2} max={99} disabled={readOnly}
    value={lobby.settings.cards_per_person}
    onChange={async (newValue) => {
      lobby.settings.cards_per_person = newValue;
      await updateLobby(lobby);
    }}
  />;
}

function NewCardsFirstControl({ lobby, readOnly }: Props) {
  return <ToggleInput disabled={readOnly}
    value={lobby.settings.new_cards_first}
    onChange={async (newValue) => {
      lobby.settings.new_cards_first = newValue;
      await updateLobby(lobby);
    }}
  />;
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