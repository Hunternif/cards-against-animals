import { Checkbox } from "../../../components/Checkbox";
import { Deck, DeckCard } from "../../../shared/types";

export function AdminDeckControlRow({
  deck,
  onToggleAll,
}: {
  deck: Deck;
  onToggleAll: () => void;
}) {
  return (
    <table className="admin-deck admin-deck-control-row">
      <tbody>
        <tr>
          <td className="col-card-id">
            <Checkbox onToggle={onToggleAll} />
          </td>
          <td className="col-card-content">Content</td>
          <td className="col-card-tags">Tags</td>
        </tr>
      </tbody>
    </table>
  );
}
