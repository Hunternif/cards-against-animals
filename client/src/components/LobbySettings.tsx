import { ReactNode } from "react";
import { updateLobby } from "../model/lobby-api";
import { GameLobby } from "../shared/types";
import { NumberInput, SelectInput, ToggleInput } from "./FormControls";
import { useDelay } from "./Delay";

interface Props {
  lobby: GameLobby,
  readOnly?: boolean,
}

export function LobbySettings(props: Props) {
  const playUntil = props.lobby.settings.play_until;
  // Delay header class to prevent background flickering bug in Chrome :(
  const headerClass = useDelay("lobby-settings", 1000) ?? "";
  return <>
    <header className={headerClass}><h3>Game Settings</h3></header>
    <div className="lobby-settings-container">
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
      <FormItem label="Sort cards by rating" control={<SortCardsByRatingControl {...props} />} />
      <FormItem label="Allow join mid-game" control={<AllowJoinMidGameControl {...props} />} />
      <FormItem label="Enable likes" control={<EnableLikesControl {...props} />} />
      <FormItem label="Freeze card stats" control={<FreezeStatsControl {...props} />} />
    </div>
  </>;
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

function SortCardsByRatingControl({ lobby, readOnly }: Props) {
  return <ToggleInput disabled={readOnly}
    value={lobby.settings.sort_cards_by_rating}
    onChange={async (newValue) => {
      lobby.settings.sort_cards_by_rating = newValue;
      await updateLobby(lobby);
    }}
  />;
}

function AllowJoinMidGameControl({ lobby, readOnly }: Props) {
  return <ToggleInput disabled={readOnly}
    value={lobby.settings.allow_join_mid_game}
    onChange={async (newValue) => {
      lobby.settings.allow_join_mid_game = newValue;
      await updateLobby(lobby);
    }}
  />;
}

function EnableLikesControl({ lobby, readOnly }: Props) {
  return <ToggleInput disabled={readOnly}
    value={lobby.settings.enable_likes}
    onChange={async (newValue) => {
      lobby.settings.enable_likes = newValue;
      await updateLobby(lobby);
    }}
  />;
}

function FreezeStatsControl({ lobby, readOnly }: Props) {
  return <ToggleInput disabled={readOnly}
    value={lobby.settings.freeze_stats}
    onChange={async (newValue) => {
      lobby.settings.freeze_stats = newValue;
      await updateLobby(lobby);
    }}
  />;
}


interface ItemProps {
  label: string,
  control: ReactNode,
}

function FormItem({ label, control }: ItemProps) {
  return <div className="lobby-settings-form-item">
    <span style={{ textAlign: "end" }}>{label}</span>
    {control}
  </div>;
}