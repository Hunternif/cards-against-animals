import { CSSProperties } from "react";
import { GameLobby } from "../shared/types";

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

export function LobbySettings({ lobby, readOnly }: Props) {
  return (
    <div style={formStyle} className="lobby-settings-container">
      <FormItem />
      <FormItem />
      <FormItem />
    </div>
  );
}

function FormItem() {
  return <div style={{
    // flex: "1 1 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1em",
    alignItems: "baseline",
  }}>
    <span style={{ textAlign: "end" }}>Play until</span>
    <select style={{ maxWidth: "12em" }} className="">
      <option value="forever">Forever</option>
      <option value="x_turns">X Turns</option>
    </select>
  </div>;
}