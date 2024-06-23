import { ReactNode } from "react";
import { Checkbox } from "../../../components/Checkbox";
import { Deck, DeckCard } from "../../../shared/types";

export function AdminDeckControlRow({
  deck,
  onToggleAll,
  selected,
}: {
  deck: Deck;
  onToggleAll: (checked: boolean) => void;
  selected: DeckCard[];
}) {
  const promptCount = deck.prompts.length;
  const resCount = deck.responses.length;
  const promptSelCount = selected.filter((c) => c.type === "prompt").length;
  const resSelCount = selected.filter((c) => c.type === "response").length;
  const isSelected = selected.length > 0;
  return (
    <table className="admin-deck-table admin-deck-control-row">
      <tbody>
        <tr>
          <td className="col-card-id">
            <Checkbox onToggle={onToggleAll} checked={isSelected} />
          </td>
          <td className="col-card-content">
            Content
            <span className="deck-count">
              {isSelected ? (
                <>
                  Selected:{" "}
                  <Count>
                    {promptSelCount}/{promptCount}
                  </Count>{" "}
                  prompts
                  <Separator />
                  <Count>
                    {resSelCount}/{resCount}
                  </Count>{" "}
                  responses
                </>
              ) : (
                <>
                  <Count>{promptCount}</Count> prompts
                  <Separator />
                  <Count>{resCount}</Count> responses
                </>
              )}
            </span>
          </td>
          <td className="col-card-tags">Tags</td>
          <td className="col-card-counter">Views</td>
          <td className="col-card-counter">Plays</td>
          <td className="col-card-counter">Wins</td>
          <td className="col-card-counter">Discards</td>
          <td className="col-card-counter">Rating</td>
        </tr>
      </tbody>
    </table>
  );
}

function Count({ children }: { children: ReactNode }) {
  return <span className="number">{children}</span>;
}

function Separator() {
  return <span style={{ margin: "0 0.5em" }}>|</span>;
}
