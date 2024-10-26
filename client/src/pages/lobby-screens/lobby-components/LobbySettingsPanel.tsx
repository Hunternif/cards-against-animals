import { ReactNode, useState } from "react";
import { useDelay } from "../../../components/Delay";
import { NumberInput, SelectInput, ToggleInput } from "../../../components/FormControls";
import { IconChevronDownInline, IconQuestionInline } from "../../../components/Icons";
import { LobbySettings } from "../../../shared/types";

interface Props {
  settings: LobbySettings,
  readOnly?: boolean,
  /** During a game some settings no longer take effect, and are disabled. */
  inGame?: boolean,
  /** Called after any setting is changed */
  onChange?: (settings: LobbySettings) => Promise<void>,
}

type SortingLevel = 'off' | 'low' | 'med' | 'high';

export function LobbySettingsPanel(props: Props) {
  const playUntil = props.settings.play_until;
  const discardCost = props.settings.discard_cost;
  // Delay header class to prevent background flickering bug in Chrome :(
  const headerClass = useDelay("lobby-settings", 1000) ?? "";
  return <div className="lobby-settings-container">
    <header className={headerClass}><h3>Game Settings</h3></header>
    <div className="lobby-settings-form">
      <FormItem label="Maximum players"
        hint="When this number is reached, other players can only spectate."
        control={<MaxPlayersControl {...props} />}
      />
      <FormItem label="Cards per person"
        hint="Each round everyone will be dealt new cards, up to this number."
        control={<CardsPerPersonControl {...props} />}
      />
      <FormItem label="Play until"
        hint="The game will end when this condition is met."
        control={<EndControl {...props} />}
      />
      {/* Prevent another item appearing next to "play until": */}
      {playUntil === "forever" && <div style={{ width: "100%", marginTop: "-0.25em" }} />}
      {playUntil === "max_turns" && (
        <FormItem label="Total turns" control={<MaxTurnsControl {...props} />} />
      )}
      {playUntil === "max_turns_per_person" && (
        <FormItem label="Turns per person"
          hint="Each player will get this many turns."
          control={<TurnsPerPersonControl {...props} />}
        />
      )}
      {playUntil === "max_score" && (
        <FormItem label="Maximum score"
          hint="When someone gets this score, the game will end."
          control={<MaxScoreControl {...props} />}
        />
      )}
       <FormItem label="Timer [sec]"
        hint="Counts down the time while players can answer (in seconds). When it expires, Czar can continue to the 'Reveal' phase. Set 0 to disable."
        control={<AnswerTimeControl {...props} />}
      />
      <FormItem label="Next turn after [sec]"
        hint="On Winner screen, auto-starts the next turn after this amount of time (in seconds). Set 0 to disable."
        control={<NextTurnTimeControl {...props} />}
      />
      <FormItem label="New cards first" disabled={props.inGame}
        hint="Cards that were never seen before will be played first."
        control={<NewCardsFirstControl {...props} />}
      />
      <FormItem label="Sort cards by rating" disabled={props.inGame}
        hint="Past statistics will affect card order: good cards first, bad cards last."
        control={<SortCardsByRatingControl {...props} />}
      />
      <FormItem label="Allow join mid-game"
        hint="If a new person joins after the game has started, they will automatically become a player and will receive cards."
        control={<AllowJoinMidGameControl {...props} />}
      />
      <FormItem label="Enable likes"
        control={<EnableLikesControl {...props} />}
        hint="Non-czar players can add 'likes' to other people's responses."
      />

      {/* Reusing cards: */}
      <FormItem label="Reuse played cards"
        control={<ReusePlayedControl {...props} />}
        hint="Played cards will be put back in the deck."
      />
      <FormItem label="Reuse discarded cards"
        control={<ReuseDiscardedControl {...props} />}
        hint="Discarded cards will be put back in the deck."
      />

      {props.settings.enable_likes && <>
        <FormItem label="Who can see likes"
          hint="By default, players can see the number of likes in real time. Hiding them can help the Czar to make an honest decision."
          control={<ShowLikesToControl {...props} />}
        />
        <FormItem label="Limit likes"
          hint="Each player can add this many likes per round."
          control={<LimitLikesControl {...props} />}
        />
      </>}
      <FormItem label="Discard cost"
        hint="Players can discard any number of cards every turn by paying this cost.
        Discard tokens are awarded every turn."
        control={<DiscardControl {...props} />}
      />
      {discardCost === 'token' && (
        <FormItem label="Starting discard tokens"
          hint="At the start of the game, each player gets this many discard tokens."
          control={<DiscardTokensControl {...props} />}
      />
      )}
      {discardCost !== 'no_discard' && (
        <FormItem label="Enable tag exchange"
          hint="During discard, players can request cards with specific tags."
          control={<EnableTagExchangeControl {...props} />}
      />
      )}
      <FormItem label="Who controls lobby"
        hint="Players with this power can change game settings, kick players, and end the game."
        control={<LobbyControlControl {...props} />}
      />
      <FormItem label="Freeze card stats"
        hint="Card statistics will not be updated during this game. Use this for test games."
        control={<FreezeStatsControl {...props} />}
      />
      <FormItem label="Enable soundboard"
        hint="People click buttons and make sounds."
        control={<EnableSoundboardControl {...props} />}
      />
    </div>
  </div>;
}

function MaxPlayersControl({ settings, readOnly, onChange }: Props) {
  return <NumberInput debounce min={2} max={99} disabled={readOnly}
    value={settings.max_players}
    onChange={async (newValue) => {
      settings.max_players = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function EndControl({ settings, readOnly, onChange }: Props) {
  return <SelectInput disabled={readOnly}
    value={settings.play_until}
    onChange={async (newValue) => {
      settings.play_until = newValue;
      if (onChange) await onChange(settings);
    }}
    options={[
      ["forever", "Forever"],
      ["max_turns", "X turns"],
      ["max_turns_per_person", "X turns each"],
      ["max_score", "X score"],
    ]}
  />;
}

function MaxTurnsControl({ settings, readOnly, onChange }: Props) {
  return <NumberInput debounce min={1} max={99} disabled={readOnly}
    value={settings.max_turns}
    onChange={async (newValue) => {
      settings.max_turns = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function MaxScoreControl({ settings, readOnly, onChange }: Props) {
  return <NumberInput debounce min={1} max={99} disabled={readOnly}
    value={settings.max_score}
    onChange={async (newValue) => {
      settings.max_score = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function TurnsPerPersonControl({ settings, readOnly, onChange }: Props) {
  return <NumberInput debounce min={1} max={99} disabled={readOnly}
    value={settings.turns_per_person}
    onChange={async (newValue) => {
      settings.turns_per_person = newValue;
      // if (inGame && !isNaN(newValue) && newValue > 0) {
      //   // Update total turns for terns per person:
      //   const players = await getAllOnlinePlayersInLobby(lobby.id);
      //   settings.max_turns = players.length * newValue;
      // }
      if (onChange) await onChange(settings);
    }}
  />;
}

function CardsPerPersonControl({ settings, readOnly, onChange }: Props) {
  return <NumberInput debounce min={2} max={99} disabled={readOnly}
    value={settings.cards_per_person}
    onChange={async (newValue) => {
      settings.cards_per_person = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function AnswerTimeControl({ settings, readOnly, onChange }: Props) {
  return <NumberInput debounce min={0} max={99999} disabled={readOnly}
    value={settings.answer_time_sec}
    onChange={async (newValue) => {
      settings.answer_time_sec = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function NextTurnTimeControl({ settings, readOnly, onChange }: Props) {
  return <NumberInput debounce min={0.0} max={99.0} step={0.5} disabled={readOnly}
    value={settings.next_turn_time_sec}
    onChange={async (newValue) => {
      settings.next_turn_time_sec = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function NewCardsFirstControl({ settings, readOnly, onChange, inGame, }: Props) {
  return <ToggleInput disabled={readOnly || inGame}
    value={settings.new_cards_first}
    onChange={async (newValue) => {
      settings.new_cards_first = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

type SortingOption = {
  level: SortingLevel,
  label: string,
  threshold: number,
}
const sortOff: SortingOption = {level: 'off', label: 'Off', threshold: 1};
const sortLow: SortingOption = {level: 'low', label: 'A little', threshold: 0.1};
const sortMed: SortingOption = {level: 'med', label: 'Normal sort', threshold: 0.01};
const sortHigh: SortingOption = {level: 'high', label: 'Strong sort', threshold: 0.0001};

function SortCardsByRatingControl({ settings, readOnly, onChange, inGame }: Props) {
  // Maps value to [label, threshold for sort_min_factor]:
  const optionMap = new Map<SortingLevel, SortingOption>([
    ['off', sortOff],
    ['low', sortLow],
    ['med', sortMed],
    ['high', sortHigh],
  ]);
  let current: SortingLevel = 'low';
  if (settings.sort_min_factor <= sortOff.threshold) current = 'off';
  if (settings.sort_min_factor <= sortLow.threshold) current = 'low';
  if (settings.sort_min_factor <= sortMed.threshold) current = 'med';
  if (settings.sort_min_factor <= sortHigh.threshold) current = 'high';
  return <SelectInput disabled={readOnly}
    value={current}
    onChange={async (newValue) => {
      const data = optionMap.get(newValue)!!;
      settings.sort_min_factor = data.threshold;
      if (onChange) await onChange(settings);
    }}
    options={[...optionMap.values()].map((v) => [v.level, v.label])}
  />;
}

function AllowJoinMidGameControl({ settings, readOnly, onChange }: Props) {
  return <ToggleInput disabled={readOnly}
    value={settings.allow_join_mid_game}
    onChange={async (newValue) => {
      settings.allow_join_mid_game = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function EnableLikesControl({ settings, readOnly, onChange }: Props) {
  return <ToggleInput disabled={readOnly}
    value={settings.enable_likes}
    onChange={async (newValue) => {
      settings.enable_likes = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function ShowLikesToControl({ settings, readOnly, onChange }: Props) {
  return <SelectInput disabled={readOnly}
    value={settings.show_likes_to}
    onChange={async (newValue) => {
      settings.show_likes_to = newValue;
      if (onChange) await onChange(settings);
    }}
    options={[
      ["all", "Everyone"],
      ["all_except_czar", "Except czar"],
    ]}
  />;
}

function LimitLikesControl({ settings, readOnly, onChange }: Props) {
  return <SelectInput disabled={readOnly}
    value={settings.likes_limit}
    onChange={async (newValue) => {
      settings.likes_limit = newValue;
      if (onChange) await onChange(settings);
    }}
    options={[
      ["none", "No limit"],
      ["1_pp_per_turn", "1 per turn"],
    ]}
  />;
}

function DiscardControl({ settings, readOnly, onChange }: Props) {
  return <SelectInput disabled={readOnly}
    value={settings.discard_cost}
    onChange={async (newValue) => {
      settings.discard_cost = newValue;
      if (onChange) await onChange(settings);
    }}
    options={[
      ["free", "Free"],
      ["token", "🔄 Token"],
      ["1_star", "1 ⭐"],
      ["1_free_then_1_star", "1 free, then 1 ⭐"],
      ["no_discard", "Disabled"],
    ]}
  />;
}

function DiscardTokensControl({ settings, readOnly, onChange }: Props) {
  return <NumberInput debounce min={0} max={99} disabled={readOnly}
    value={settings.init_discard_tokens}
    onChange={async (newValue) => {
      settings.init_discard_tokens = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function EnableTagExchangeControl({ settings, readOnly, onChange }: Props) {
  return <ToggleInput disabled={readOnly}
    value={settings.enable_tag_exchange}
    onChange={async (newValue) => {
      settings.enable_tag_exchange = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function LobbyControlControl({ settings, readOnly, onChange }: Props) {
  return <SelectInput disabled={readOnly}
    value={settings.lobby_control}
    onChange={async (newValue) => {
      settings.lobby_control = newValue;
      if (onChange) await onChange(settings);
    }}
    options={[
      ["creator", "Only creator"],
      ["creator_or_czar", "Creator or czar"],
      ["players", "Players"],
      ["anyone", "Anyone (spectators)"],
    ]}
  />;
}

function FreezeStatsControl({ settings, readOnly, onChange }: Props) {
  return <ToggleInput disabled={readOnly}
    value={settings.freeze_stats}
    onChange={async (newValue) => {
      settings.freeze_stats = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function EnableSoundboardControl({ settings, readOnly, onChange }: Props) {
  return <ToggleInput disabled={readOnly}
    value={settings.enable_soundboard}
    onChange={async (newValue) => {
      settings.enable_soundboard = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function ReusePlayedControl({ settings, readOnly, onChange }: Props) {
  return <ToggleInput disabled={readOnly}
    value={settings.reuse_played_cards}
    onChange={async (newValue) => {
      settings.reuse_played_cards = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}

function ReuseDiscardedControl({ settings, readOnly, onChange }: Props) {
  return <ToggleInput disabled={readOnly}
    value={settings.reuse_discarded_cards}
    onChange={async (newValue) => {
      settings.reuse_discarded_cards = newValue;
      if (onChange) await onChange(settings);
    }}
  />;
}



interface ItemProps {
  label: string,
  hint?: ReactNode,
  control: ReactNode,
  disabled?: boolean,
}

function FormItem({ label, hint, control, disabled }: ItemProps) {
  const disabledClass = disabled ? "disabled" : "";
  const [showHint, setShowHint] = useState(false);
  return <div className={`lobby-settings-form-item ${disabledClass}`}>
    <div className="label-container">
      <div className="label">
        {label}
        {hint && (
          <span className="hint-icon"
            title={showHint ? "Hide help" : "Show help"}
            onClick={() => setShowHint(!showHint)}>
            {showHint ? <IconChevronDownInline /> : <IconQuestionInline />}
          </span>
        )}
      </div>
      {showHint && <div className="hint">{hint}</div>}
    </div>
    {control}
  </div>;
}